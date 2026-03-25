/**
 * Webhook para receber mensagens do WhatsApp via Evolution API v2
 *
 * Recebe eventos MESSAGES_UPSERT da Evolution API e responde automaticamente
 * usando o agente de IA do Odonto GPT.
 *
 * Features:
 * - Validação por API key no header
 * - Deduplicação de mensagens (evita processar a mesma mensagem duas vezes)
 * - Memória de conversa (últimas 10 mensagens)
 * - Vinculação com profile para personalização
 * - Transcrição de áudio via OpenAI Whisper
 * - Chunking automático para respostas longas
 * - Indicador "digitando..." durante o processamento
 */

import { type NextRequest, NextResponse } from "next/server"
import { processConversationSync } from "@/lib/ai/agent"
import { sendWhatsAppMessage, sendTyping } from "@/lib/evolution/client"
import { transcribeAudio } from "@/lib/whatsapp/audio-transcription"
import {
  getConversationContext,
  saveMessage,
  formatMessagesForAgent,
  calcTrialDays,
} from "@/lib/whatsapp/conversation-service"

export const runtime = "nodejs"
export const maxDuration = 60

// ─── Deduplication ───────────────────────────────────────────────────────────

const processedMessages = new Map<string, number>()
const DEDUP_TTL_MS = 5 * 60 * 1000

function isDuplicate(messageId: string): boolean {
  const now = Date.now()
  for (const [id, ts] of processedMessages) {
    if (now - ts > DEDUP_TTL_MS) processedMessages.delete(id)
  }
  if (processedMessages.has(messageId)) return true
  processedMessages.set(messageId, now)
  return false
}

// ─── Evolution API Types ──────────────────────────────────────────────────────

interface EvolutionMessageKey {
  remoteJid: string
  fromMe: boolean
  id: string
  participant?: string
}

interface EvolutionAudioMessage {
  url?: string
  mimetype?: string
  fileLength?: number
  seconds?: number
  ptt?: boolean
  mediaKey?: string
  fileEncSha256?: string
  fileSha256?: string
  directPath?: string
}

interface EvolutionImageMessage {
  url?: string
  caption?: string
  mimetype?: string
  mediaKey?: string
  directPath?: string
}

interface EvolutionMessageContent {
  conversation?: string
  extendedTextMessage?: { text: string }
  audioMessage?: EvolutionAudioMessage
  imageMessage?: EvolutionImageMessage
  videoMessage?: { caption?: string }
  documentMessage?: { caption?: string; title?: string }
  stickerMessage?: unknown
  reactionMessage?: unknown
  pollCreationMessage?: unknown
}

interface EvolutionMessageData {
  key: EvolutionMessageKey
  pushName?: string
  message?: EvolutionMessageContent
  messageType?: string
  messageTimestamp?: number
  owner?: string
  source?: string
}

interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: EvolutionMessageData | EvolutionMessageData[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extrai número de telefone do remoteJid da Evolution API
 * Ex: "5511999999999@s.whatsapp.net" → "5511999999999"
 */
function extractPhone(remoteJid: string): string {
  return remoteJid.split("@")[0]
}

/**
 * Verifica se é mensagem de grupo (jid termina com @g.us)
 */
function isGroupMessage(remoteJid: string): boolean {
  return remoteJid.endsWith("@g.us")
}

/**
 * Extrai o texto principal de uma mensagem
 */
function extractTextFromMessage(message: EvolutionMessageContent): string {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.documentMessage?.title ||
    ""
  )
}

/**
 * Valida o webhook via EVOLUTION_WEBHOOK_SECRET no header
 */
function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET
  if (!secret) return true // Se não configurado, aceita tudo

  const headerSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace("Bearer ", "")

  return headerSecret === secret
}

// ─── Message Processor ───────────────────────────────────────────────────────

async function processMessage(data: EvolutionMessageData): Promise<void> {
  const { key, pushName, message, messageType } = data

  if (!message) return

  const phone = extractPhone(key.remoteJid)

  // 1. Mostrar "digitando..." enquanto processa
  await sendTyping(phone)

  // 2. Obter contexto de conversa (cria ou recupera)
  const { conversation, profile, messages } = await getConversationContext(
    phone,
    pushName
  )

  // 3. Processar conteúdo da mensagem
  let text = extractTextFromMessage(message)

  // 3a. Transcrever áudio se necessário
  if (!text && messageType === "audioMessage" && message.audioMessage?.url) {
    try {
      console.log("[Evolution Webhook] Transcrevendo áudio...")
      text = await transcribeAudio(message.audioMessage.url)

      await saveMessage(conversation.id, "user", text, {
        original_type: "audio",
        audio_url: message.audioMessage.url,
      })
    } catch (error) {
      console.error("[Evolution Webhook] Erro na transcrição:", error)
      await sendWhatsAppMessage(
        phone,
        "Não consegui entender o áudio. Pode tentar novamente ou digitar sua dúvida?"
      )
      return
    }
  }

  // 3b. Sem texto — informar ao usuário
  if (!text) {
    if (
      messageType === "imageMessage" ||
      messageType === "videoMessage" ||
      messageType === "documentMessage" ||
      messageType === "stickerMessage"
    ) {
      await sendWhatsAppMessage(
        phone,
        "Recebi sua mídia! Por enquanto, posso ajudar melhor com mensagens de texto ou áudio. Qual sua dúvida? 😊"
      )
    }
    return
  }

  // 4. Salvar mensagem do usuário (se não foi salva durante transcrição de áudio)
  if (messageType !== "audioMessage") {
    await saveMessage(conversation.id, "user", text)
  }

  // 5. Preparar histórico para o agente
  const history = formatMessagesForAgent(messages)
  history.push({ role: "user", content: text })

  // 6. Contexto do usuário para personalização
  const userContext = profile
    ? {
        name: profile.name,
        planType: profile.plan_type,
        trialDaysLeft: calcTrialDays(profile.trial_ends_at),
        pipelineStage: profile.pipeline_stage,
      }
    : undefined

  // 7. Processar com agente de IA
  console.log(`[Evolution Webhook] Processando mensagem de ${phone}`)
  const response = await processConversationSync(
    history,
    phone,
    "odonto-gpt",
    userContext
  )

  // 8. Salvar resposta do assistente
  await saveMessage(conversation.id, "assistant", response)

  // 9. Enviar resposta via Evolution API
  await sendWhatsAppMessage(phone, response)

  console.log(`[Evolution Webhook] Resposta enviada para ${phone}`)
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Validar webhook secret
    if (!validateWebhookSecret(request)) {
      console.warn("[Evolution Webhook] Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as EvolutionWebhookPayload

    console.log("[Evolution Webhook] Evento recebido:", {
      event: payload.event,
      instance: payload.instance,
    })

    // 2. Processar apenas MESSAGES_UPSERT
    if (payload.event !== "messages.upsert") {
      return NextResponse.json({ ok: true })
    }

    // 3. Normalizar data (pode ser array ou objeto único)
    const messages = Array.isArray(payload.data)
      ? payload.data
      : [payload.data]

    for (const data of messages) {
      const { key, messageType } = data

      // Ignorar mensagens enviadas pelo bot
      if (key.fromMe) continue

      // Ignorar grupos
      if (isGroupMessage(key.remoteJid)) continue

      // Ignorar tipos não-textuais sem conteúdo útil
      if (
        messageType === "reactionMessage" ||
        messageType === "pollCreationMessage" ||
        messageType === "protocolMessage" ||
        !messageType
      ) {
        continue
      }

      // Deduplicar
      if (isDuplicate(key.id)) {
        console.log("[Evolution Webhook] Mensagem duplicada ignorada:", key.id)
        continue
      }

      // Processar mensagem de forma assíncrona (não bloquear o response)
      processMessage(data).catch((error) => {
        console.error("[Evolution Webhook] Erro ao processar mensagem:", error)
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Evolution Webhook] Erro:", error)
    // Retornar 200 para evitar retentativas desnecessárias da Evolution API
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : "Erro interno",
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Odonto GPT — Evolution API Webhook",
    timestamp: new Date().toISOString(),
  })
}
