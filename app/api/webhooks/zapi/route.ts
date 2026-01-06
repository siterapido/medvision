/**
 * Webhook para receber mensagens do WhatsApp via Z-API
 * 
 * Este endpoint recebe callbacks do Z-API quando mensagens são recebidas
 * e responde automaticamente usando o agente de IA.
 */

import { type NextRequest, NextResponse } from "next/server"
import { processMessageSync } from "@/lib/ai/agent"
import { sendZApiText } from "@/lib/zapi"
import type { ZApiWebhookPayload, ZApiWebhookMessage } from "@/lib/ai/types"

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

        if (!message.text) {
            // Se não é texto (áudio, imagem, etc.), enviar mensagem informativa
            if (message.hasAudio || message.hasImage || message.hasDocument) {
                await sendZApiText(
                    message.phone,
                    "Desculpe, no momento só consigo processar mensagens de texto. Por favor, digite sua dúvida. 📝"
                )
            }
            return NextResponse.json({ ok: true })
        }

        console.log("[Z-API Webhook] Processando mensagem de", message.phone)

        // Processar mensagem com o agente de IA
        const response = await processMessageSync(message.text, message.phone)

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
