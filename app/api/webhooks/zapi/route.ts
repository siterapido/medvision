/**
 * Webhook para receber mensagens do WhatsApp via Z-API
 *
 * Este endpoint recebe callbacks do Z-API quando mensagens são recebidas
 * e responde automaticamente usando o agente de IA.
 *
 * Features:
 * - Validação de Client-Token para segurança
 * - Deduplicação de mensagens (evita processar a mesma mensagem duas vezes)
 * - Memória de conversa (últimas 10 mensagens)
 * - Vinculação com profile para personalização
 * - Transcrição de áudio via OpenAI Whisper
 * - Chunking automático para respostas longas
 */

import { type NextRequest, NextResponse } from "next/server"
import { processConversationSync } from "@/lib/ai/agent"
import { validateWebhookToken } from "@/lib/zapi"
import { sendWhatsAppResponse } from "@/lib/whatsapp/send-response"
import type { ZApiWebhookPayload, ZApiWebhookMessage } from "@/lib/ai/types"
import {
  getConversationContext,
  saveMessage,
  formatMessagesForAgent,
  calcTrialDays,
} from "@/lib/whatsapp/conversation-service"
import { transcribeAudio } from "@/lib/whatsapp/audio-transcription"

export const runtime = "nodejs"
export const maxDuration = 60

// In-memory set to deduplicate messages (TTL: 5 minutes)
const processedMessages = new Map<string, number>()
const DEDUP_TTL_MS = 5 * 60 * 1000

function cleanupProcessedMessages() {
  const now = Date.now()
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > DEDUP_TTL_MS) {
      processedMessages.delete(id)
    }
  }
}

function isDuplicate(messageId: string): boolean {
  cleanupProcessedMessages()
  if (processedMessages.has(messageId)) {
    return true
  }
  processedMessages.set(messageId, Date.now())
  return false
}

/**
 * Extrai informações relevantes da mensagem Z-API
 */
function parseZApiMessage(body: ZApiWebhookMessage) {
  return {
    phone: body.phone,
    messageId: body.messageId,
    isGroup: body.isGroup,
    fromMe: body.fromMe,
    text: body.text?.message || "",
    hasImage: !!body.image,
    hasAudio: !!body.audio,
    hasVideo: !!body.video,
    hasDocument: !!body.document,
    isReaction: !!body.reaction,
    isNotification: !!body.notification,
    senderName: body.senderName || body.chatName,
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Client-Token header for webhook security
    const clientToken = request.headers.get("client-token") || request.headers.get("Client-Token")
    if (!validateWebhookToken(clientToken)) {
      console.warn("[Z-API Webhook] Invalid or missing Client-Token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as ZApiWebhookPayload

    console.log("[Z-API Webhook] Recebido:", {
      type: payload.type,
      phone: payload.phone,
    })

    // 2. Only process received messages
    if (payload.type !== "ReceivedCallback") {
      return NextResponse.json({ ok: true })
    }

    const message = parseZApiMessage(payload.body)

    // 3. Ignore own messages, group messages, reactions, and notifications
    if (message.fromMe || message.isGroup || message.isReaction || message.isNotification) {
      return NextResponse.json({ ok: true })
    }

    // 4. Deduplicate messages
    if (isDuplicate(message.messageId)) {
      console.log("[Z-API Webhook] Mensagem duplicada ignorada:", message.messageId)
      return NextResponse.json({ ok: true })
    }

    // 5. Get conversation context (includes linked profile and previous messages)
    const { conversation, profile, messages } = await getConversationContext(
      message.phone,
      message.senderName
    )

    console.log("[Z-API Webhook] Contexto obtido:", {
      conversationId: conversation.id,
      hasProfile: !!profile,
      messageCount: messages.length,
    })

    // 6. Process audio if present (transcribe via OpenAI Whisper)
    if (!message.text && message.hasAudio && payload.body.audio?.audioUrl) {
      try {
        console.log("[Z-API Webhook] Transcrevendo áudio...")
        const transcription = await transcribeAudio(payload.body.audio.audioUrl)
        message.text = transcription

        await saveMessage(conversation.id, "user", transcription, {
          original_type: "audio",
          audio_url: payload.body.audio.audioUrl,
        })

        console.log("[Z-API Webhook] Áudio transcrito com sucesso")
      } catch (error) {
        console.error("[Z-API Webhook] Erro na transcrição:", error)
        await sendWhatsAppResponse(
          message.phone,
          "Não consegui entender o áudio. Pode tentar novamente ou digitar sua dúvida?"
        )
        return NextResponse.json({ ok: true })
      }
    }

    // 7. Handle messages without text content
    if (!message.text) {
      if (message.hasImage) {
        const caption = payload.body.image?.caption
        if (caption) {
          message.text = caption
          await saveMessage(conversation.id, "user", caption, {
            original_type: "image",
            image_url: payload.body.image?.imageUrl,
          })
        } else {
          await sendWhatsAppResponse(
            message.phone,
            "Recebi sua imagem! Por enquanto, posso ajudar melhor com mensagens de texto ou áudio. Qual sua dúvida?"
          )
          return NextResponse.json({ ok: true })
        }
      } else if (message.hasVideo || message.hasDocument) {
        await sendWhatsAppResponse(
          message.phone,
          "Recebi sua mídia! Por enquanto, posso ajudar melhor com mensagens de texto ou áudio. Qual sua dúvida?"
        )
        return NextResponse.json({ ok: true })
      } else {
        return NextResponse.json({ ok: true })
      }
    }

    // 8. Save user message (if not already saved from audio/image processing)
    if (!message.hasAudio && !(message.hasImage && payload.body.image?.caption)) {
      await saveMessage(conversation.id, "user", message.text)
    }

    console.log("[Z-API Webhook] Processando mensagem de", message.phone)

    // 9. Prepare message history for the AI agent
    const history = formatMessagesForAgent(messages)
    history.push({ role: "user", content: message.text })

    // 10. Prepare user context for personalization
    const userContext = profile
      ? {
        name: profile.name,
        planType: profile.plan_type,
        trialDaysLeft: calcTrialDays(profile.trial_ends_at),
        pipelineStage: profile.pipeline_stage,
      }
      : undefined

    // 11. Process with AI agent
    const response = await processConversationSync(
      history,
      message.phone,
      "medvision",
      userContext
    )

    // 12. Save assistant response
    await saveMessage(conversation.id, "assistant", response)

    // 13. Send response via Z-API with automatic chunking for long messages
    await sendWhatsAppResponse(message.phone, response)

    console.log("[Z-API Webhook] Resposta enviada para", message.phone)

    return NextResponse.json({
      success: true,
      phone: message.phone,
    })
  } catch (error) {
    console.error("[Z-API Webhook] Erro:", error)

    // Return 200 to prevent Z-API from retrying
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : "Erro interno",
    })
  }
}

/**
 * GET para verificar se o webhook está ativo
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "MedVision WhatsApp Webhook",
    timestamp: new Date().toISOString(),
  })
}
