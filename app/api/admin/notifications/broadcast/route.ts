/**
 * API Route: Broadcast de Notificações via WhatsApp
 *
 * Envia mensagens em massa para múltiplos usuários com rate limiting
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendNotification, processTemplate } from "@/lib/notifications"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutos para broadcasts grandes

interface BroadcastRequest {
  userIds: string[]
  message: string
  templateId?: string
}

interface BroadcastResult {
  userId: string
  success: boolean
  error?: string
}

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
}

// Rate limit: 20 mensagens por minuto (1 a cada 3 segundos para segurança)
const BATCH_SIZE = 10
const DELAY_BETWEEN_MESSAGES_MS = 3000 // 3 segundos entre mensagens

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BroadcastRequest
    const { userIds, message, templateId } = body

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário selecionado" },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Mensagem não pode estar vazia" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar perfis dos usuários selecionados
    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email, whatsapp")
      .in("id", userIds)
      .not("whatsapp", "is", null)

    const profiles = data as ProfileData[] | null

    if (profilesError) {
      console.error("[Broadcast] Error fetching profiles:", profilesError)
      return NextResponse.json(
        { error: "Erro ao buscar perfis" },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário com WhatsApp encontrado" },
        { status: 400 }
      )
    }

    console.log(`[Broadcast] Iniciando envio para ${profiles.length} usuários`)

    const results: BroadcastResult[] = []
    let sent = 0
    let failed = 0

    // Processar em batches para respeitar rate limit
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i]

      // Processar variáveis na mensagem
      const processedMessage = processTemplate(message, {
        name: profile.name || "Cliente",
        email: profile.email || "",
      })

      try {
        const result = await sendNotification(
          profile.id,
          processedMessage,
          "whatsapp",
          templateId
        )

        if (result.success) {
          results.push({ userId: profile.id, success: true })
          sent++
        } else {
          results.push({
            userId: profile.id,
            success: false,
            error: result.error || "Erro desconhecido",
          })
          failed++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
        results.push({
          userId: profile.id,
          success: false,
          error: errorMessage,
        })
        failed++
      }

      // Delay entre mensagens para respeitar rate limit
      // Não precisa delay na última mensagem
      if (i < profiles.length - 1) {
        await sleep(DELAY_BETWEEN_MESSAGES_MS)
      }

      // Log de progresso a cada batch
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(
          `[Broadcast] Progresso: ${i + 1}/${profiles.length} (${sent} enviados, ${failed} falhas)`
        )
      }
    }

    console.log(
      `[Broadcast] Concluído: ${sent} enviados, ${failed} falhas de ${profiles.length} total`
    )

    return NextResponse.json({
      total: profiles.length,
      sent,
      failed,
      details: results,
    })
  } catch (error) {
    console.error("[Broadcast] Error:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
}
