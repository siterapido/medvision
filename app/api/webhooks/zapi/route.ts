/**
 * Webhook para receber mensagens do WhatsApp via Z-API
 *
 * Este endpoint recebe callbacks do Z-API quando mensagens são recebidas
 * e responde automaticamente usando o agente de IA.
 *
 * Features:
 * - Memória de conversa (últimas 10 mensagens)
 * - Vinculação com profile para personalização
 * - Transcrição de áudio via OpenAI Whisper
 */

import { type NextRequest, NextResponse } from "next/server"
import { processConversationSync } from "@/lib/ai/agent"
import { sendZApiText } from "@/lib/zapi"
import type { ZApiWebhookPayload, ZApiWebhookMessage } from "@/lib/ai/types"
import {
  getConversationContext,
  saveMessage,
  formatMessagesForAgent,
  calcTrialDays,
} from "@/lib/whatsapp/conversation-service"
import { transcribeAudio } from "@/lib/whatsapp/audio-transcription"

export const runtime = "nodejs" // Z-API pode demorar, usar nodejs
export const maxDuration = 60

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
        hasDocument: !!body.document,
        senderName: body.senderName || body.chatName,
    }
}

/**
 * Valida o webhook secret (opcional, mas recomendado)
 */
function validateWebhookSecret(request: NextRequest): boolean {
    const secret = process.env.Z_API_WEBHOOK_SECRET
    if (!secret) {
        // Se não há secret configurado, aceitar todas as requisições
        return true
    }

    const headerSecret = request.headers.get("x-webhook-secret")
    return headerSecret === secret
}

export async function POST(request: NextRequest) {
    try {
        // Validar secret se configurado
        if (!validateWebhookSecret(request)) {
            console.warn("[Z-API Webhook] Secret inválido")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const payload = (await request.json()) as ZApiWebhookPayload

        // Log para debug
        console.log("[Z-API Webhook] Recebido:", {
            type: payload.type,
            phone: payload.phone,
        })

        // Verificar se é uma mensagem recebida
        if (payload.type !== "ReceivedCallback") {
            // Outros tipos de callback (status, etc.) - apenas acknowledge
            return NextResponse.json({ ok: true })
        }

        const message = parseZApiMessage(payload.body)

        // Ignorar mensagens próprias, de grupo ou vazias
        if (message.fromMe) {
            console.log("[Z-API Webhook] Ignorando mensagem própria")
            return NextResponse.json({ ok: true })
        }

        if (message.isGroup) {
            console.log("[Z-API Webhook] Ignorando mensagem de grupo")
            return NextResponse.json({ ok: true })
        }

        // Obter contexto da conversa (inclui profile vinculado e mensagens anteriores)
        const { conversation, profile, messages } = await getConversationContext(
            message.phone,
            message.senderName
        )

        console.log("[Z-API Webhook] Contexto obtido:", {
            conversationId: conversation.id,
            hasProfile: !!profile,
            messageCount: messages.length,
        })

        // Processar áudio se presente
        if (!message.text && message.hasAudio && payload.body.audio?.audioUrl) {
            try {
                console.log("[Z-API Webhook] Transcrevendo áudio...")
                const transcription = await transcribeAudio(payload.body.audio.audioUrl)
                message.text = transcription

                // Salvar mensagem com metadata indicando que era áudio
                await saveMessage(conversation.id, "user", transcription, {
                    original_type: "audio",
                    audio_url: payload.body.audio.audioUrl,
                })

                console.log("[Z-API Webhook] Áudio transcrito com sucesso")
            } catch (error) {
                console.error("[Z-API Webhook] Erro na transcrição:", error)
                await sendZApiText(
                    message.phone,
                    "Não consegui entender o áudio. Pode tentar novamente ou digitar sua dúvida?"
                )
                return NextResponse.json({ ok: true })
            }
        }

        if (!message.text) {
            // Se ainda não tem texto (imagem, documento sem legenda), informar
            if (message.hasImage || message.hasDocument) {
                await sendZApiText(
                    message.phone,
                    "Recebi sua mídia! Por enquanto, posso ajudar melhor com mensagens de texto ou áudio. Qual sua dúvida?"
                )
            }
            return NextResponse.json({ ok: true })
        }

        // Salvar mensagem do usuário (se não foi áudio, que já foi salvo acima)
        if (!message.hasAudio) {
            await saveMessage(conversation.id, "user", message.text)
        }

        console.log("[Z-API Webhook] Processando mensagem de", message.phone)

        // Preparar histórico para o agente (últimas 10 mensagens + mensagem atual)
        const history = formatMessagesForAgent(messages)
        history.push({ role: "user", content: message.text })

        // Preparar contexto do usuário para personalização
        const userContext = profile
            ? {
                  name: profile.name,
                  planType: profile.plan_type,
                  trialDaysLeft: calcTrialDays(profile.trial_ends_at),
                  pipelineStage: profile.pipeline_stage,
              }
            : undefined

        // Processar com histórico de conversa
        const response = await processConversationSync(
            history,
            message.phone,
            "odonto-gpt",
            userContext
        )

        // Salvar resposta do assistente
        await saveMessage(conversation.id, "assistant", response)

        // Enviar resposta via Z-API
        await sendZApiText(message.phone, response)

        console.log("[Z-API Webhook] Resposta enviada para", message.phone)

        return NextResponse.json({
            success: true,
            phone: message.phone,
        })
    } catch (error) {
        console.error("[Z-API Webhook] Erro:", error)

        // Não retornar erro para o Z-API para evitar retries
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
        service: "Odonto GPT WhatsApp Webhook",
        timestamp: new Date().toISOString(),
    })
}
