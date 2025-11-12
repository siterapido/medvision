import { NextRequest, NextResponse } from "next/server"
import { generateCheckoutUrl } from "@/lib/cakto"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type CheckoutPayload = {
  email?: string
  customData?: Record<string, unknown>
}

function normalizeCustomData(value: Record<string, unknown> | undefined) {
  if (!value || typeof value !== "object") {
    return {}
  }

  return Object.entries(value).reduce<Record<string, string>>((acc, [key, entry]) => {
    if (!key) return acc
    acc[key] = typeof entry === "string" ? entry : String(entry ?? "")
    return acc
  }, {})
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()

  let payload: CheckoutPayload = {}
  try {
    payload = (await request.json()) as CheckoutPayload
  } catch (error) {
    console.info("[cakto/checkout-url] body inválido, usando defaults", error)
  }

  const email = payload.email?.trim() || authData?.user?.email || undefined
  if (!email) {
    return NextResponse.json({ error: "Informe um e-mail" }, { status: 400 })
  }

  const url = generateCheckoutUrl(email, normalizeCustomData(payload.customData))
  return NextResponse.json({ url })
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
