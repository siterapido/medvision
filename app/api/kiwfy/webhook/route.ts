import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  KiwfyWebhookSchema,
  extractSignature,
  normalizePhone,
  normalizeStatus,
  resolvePlanSlug,
  resolvePurchaseId,
  resolveWhatsappOptIn,
  shouldProvision,
  verifyKiwfySignature,
} from "@/lib/kiwfy/webhook"
import { sendMagicLinkViaWhatsApp } from "@/lib/whatsapp/zapi"

function generatePassword() {
  return randomBytes(12).toString("base64url")
}

function buildRedirectTo() {
  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL

  if (!baseUrl) {
    return undefined
  }

  try {
    const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    const url = new URL("/login", normalizedBase)
    return url.toString()
  } catch {
    return undefined
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = extractSignature(request)

  try {
    const signatureValid = verifyKiwfySignature(rawBody, signature)
    if (!signatureValid) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 })
    }
  } catch (error) {
    console.error("[api/kiwfy/webhook] assinatura", error)
    return NextResponse.json({ error: "Configuração do webhook ausente." }, { status: 500 })
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
  }

  const parsed = KiwfyWebhookSchema.safeParse(parsedJson)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload fora do padrão esperado.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const payload = parsed.data
  const purchaseId = resolvePurchaseId(payload.data)
  const normalizedStatus = normalizeStatus(payload.data.status)

  if (!purchaseId) {
    return NextResponse.json({ error: "purchase_id ausente no webhook." }, { status: 400 })
  }

  if (!shouldProvision(normalizedStatus)) {
    return NextResponse.json(
      {
        ok: true,
        ignored: true,
        reason: `Status ${normalizedStatus} não dispara provisionamento.`,
      },
      { status: 200 },
    )
  }

  const adminClient = createAdminClient()

  try {
    const { data: duplicated } = await adminClient
      .from("kiwfy_webhook_events")
      .select("id")
      .eq("purchase_id", purchaseId)
      .eq("status", normalizedStatus)
      .maybeSingle()

    if (duplicated) {
      return NextResponse.json(
        {
          ok: true,
          duplicated: true,
          purchaseId,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("[api/kiwfy/webhook] erro ao verificar duplicidade", error)
  }

  const email = payload.data.customer.email.toLowerCase()
  const name = payload.data.customer.name?.trim() || email.split("@")[0]
  const planSlug = resolvePlanSlug(payload.data)
  const whatsappPhone = normalizePhone(payload.data.customer.phone)
  const whatsappOptIn = resolveWhatsappOptIn(payload.data)
  const redirectTo = buildRedirectTo()

  const eventRecordBase = {
    purchase_id: purchaseId,
    event_type: payload.event,
    status: normalizedStatus,
    email,
    phone: payload.data.customer.phone ?? null,
    payload,
  }

  try {
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    let userId = existingProfile?.id ?? null

    if (!userId) {
      const created = await adminClient.auth.admin.createUser({
        email,
        password: generatePassword(),
        email_confirm: true,
        user_metadata: {
          name,
          role: "cliente",
          source: "kiwfy",
        },
      })

      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "Não foi possível criar o usuário no Supabase.")
      }

      userId = created.data.user.id
    }

    if (!userId) {
      throw new Error("Usuário não encontrado e não foi possível criar um novo.")
    }

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        name,
        email,
        role: "cliente",
        kiwfy_purchase_id: purchaseId,
        kiwfy_plan: planSlug,
        kiwfy_status: normalizedStatus,
        whatsapp_phone: whatsappPhone,
        whatsapp_opt_in: whatsappOptIn,
      },
      { onConflict: "id" },
    )

    if (profileError) {
      throw new Error(profileError.message)
    }

    const linkResult = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (linkResult.error) {
      throw new Error(linkResult.error.message)
    }

    const magicLink = linkResult.data?.properties?.action_link ?? linkResult.data?.action_link

    if (!magicLink) {
      throw new Error("Supabase não retornou o magic link.")
    }

    let whatsappStatus: "sent" | "skipped" | "failed" = "skipped"
    let whatsappResponse: unknown = null
    let whatsappError: string | null = null

    if (whatsappPhone && whatsappOptIn) {
      const delivery = await sendMagicLinkViaWhatsApp({
        phone: whatsappPhone,
        magicLink,
        name,
        plan: planSlug,
      })

      whatsappStatus = delivery.status
      if ("response" in delivery) {
        whatsappResponse = delivery.response
      }

      if (delivery.status === "failed") {
        whatsappError = delivery.error
      }

      if (delivery.status === "sent") {
        const { error: lastMessageError } = await adminClient
          .from("profiles")
          .update({ whatsapp_last_message_at: new Date().toISOString() })
          .eq("id", userId)
        if (lastMessageError) {
          console.warn("[api/kiwfy/webhook] não foi possível atualizar whatsapp_last_message_at", lastMessageError)
        }
      }
    }

    await adminClient.from("kiwfy_webhook_events").insert({
      ...eventRecordBase,
      whatsapp_status: whatsappStatus,
      whatsapp_response: whatsappResponse,
      error: whatsappError,
    })

    return NextResponse.json(
      {
        ok: true,
        userId,
        plan: planSlug,
        status: normalizedStatus,
        whatsappStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[api/kiwfy/webhook]", error)
    try {
      await adminClient.from("kiwfy_webhook_events").insert({
        ...eventRecordBase,
        error: error instanceof Error ? error.message : "Erro inesperado ao processar webhook.",
      })
    } catch (logError) {
      console.error("[api/kiwfy/webhook] falha ao registrar evento", logError)
    }

    return NextResponse.json({ error: "Falha ao processar o webhook da Kiwfy." }, { status: 500 })
  }
}
