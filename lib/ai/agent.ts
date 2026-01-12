/**
 * Serviço centralizado do Agente de IA Odonto GPT
 * 
 * Este módulo processa mensagens de qualquer canal (web ou WhatsApp)
 * e retorna respostas usando a API da OpenAI.
 */

import { openai } from "@ai-sdk/openai"
import { generateText, streamText, type CoreMessage } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getSystemPrompt } from "./prompts/system"
import { AI_CONFIG, AI_ERROR_MESSAGES } from "./config"
import type { ProcessMessageOptions, AIMessage, AIChannel } from "./types"

/**
 * Busca o histórico de conversas do usuário
 */
async function getConversationHistory(
    userId: string,
    threadId?: string,
    channel: AIChannel = "web",
    limit = 10
): Promise<CoreMessage[]> {
    try {
        const supabase = await createClient()

        if (channel === "whatsapp" && threadId) {
            // Para WhatsApp, buscar da tabela de conversas WhatsApp
            const { data: messages } = await supabase
                .from("whatsapp_messages")
                .select("role, content")
                .eq("conversation_id", threadId)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (messages && messages.length > 0) {
                return messages
                    .reverse()
                    .map((m) => ({
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    }))
            }
        } else if (threadId) {
            // Para web, buscar da tabela chat_messages
            const { data: messages } = await supabase
                .from("chat_messages")
                .select("role, content")
                .eq("thread_id", threadId)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (messages && messages.length > 0) {
                return messages
                    .reverse()
                    .map((m) => ({
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    }))
            }
        }

        return []
    } catch (error) {
        console.error("[AI Agent] Erro ao buscar histórico:", error)
        return []
    }
}

/**
 * Salva uma mensagem no banco de dados
 */
async function saveMessage(
    userId: string,
    threadId: string,
    role: "user" | "assistant",
    content: string,
    channel: AIChannel = "web"
): Promise<void> {
    try {
        const supabase = await createClient()

        if (channel === "whatsapp") {
            await supabase.from("whatsapp_messages").insert({
                conversation_id: threadId,
                role,
                content,
            })

            // Atualizar last_message_at da conversa
            await supabase
                .from("whatsapp_conversations")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", threadId)
        } else {
            await supabase.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role,
                content,
            })

            // Atualizar last_message_at da thread
            await supabase
                .from("chat_threads")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", threadId)
        }
    } catch (error) {
        console.error("[AI Agent] Erro ao salvar mensagem:", error)
    }
}

/**
 * Obtém ou cria uma conversa do WhatsApp
 */
export async function getOrCreateWhatsAppConversation(
    phone: string
): Promise<string> {
    const supabase = await createClient()

    // Tentar encontrar conversa existente
    const { data: existing } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("phone", phone)
        .single()

    if (existing) {
        return existing.id
    }

    // Criar nova conversa
    const { data: newConversation, error } = await supabase
        .from("whatsapp_conversations")
        .insert({ phone })
        .select("id")
        .single()

    if (error || !newConversation) {
        throw new Error("Falha ao criar conversa WhatsApp")
    }

    return newConversation.id
}

/**
 * Processa uma mensagem e retorna a resposta do agente via AGNO Service
 * 
 * @param options - Opções de processamento
 * @returns Para streaming, retorna o ReadableStream. Para não-streaming, retorna o texto.
 */
export async function processMessage(options: ProcessMessageOptions) {
    const {
        message,
        userId,
        channel,
        threadId,
        streaming = true,
        metadata = {},
    } = options

    // Obter system prompt (opcional, já que o AGNO gerencia isso)
    // Manter lógica de histórico se quisermos passar contexto, mas AGNO tem memória
    // Para simplificar, confiamos no backend AGNO, mas passamos histórico se necessário
    // Por enquanto, vamos passar apenas a mensagem atual, já que o AGNO lida com sessão se tiver sessionId

    // Salvar mensagem do usuário
    if (threadId) {
        await saveMessage(userId, threadId, "user", message, channel)
    }

    // Chamar serviço AGNO
    // Usamos threadId como sessionId para manter contexto no lado do Python se suportado
    const stream = await import("./agno-service").then(m => m.streamAgnoChat(
        message,
        userId,
        threadId, // Session ID
        "auto"
    ))

    if (streaming) {
        // Retornar o stream para quem chamou (ex: route handler customizado)
        // Nota: app/api/chat/route.ts já usa streamAgnoChat diretamente
        return stream
    } else {
        // Para WhatsApp/Sync - consumir o stream e retornar texto completo
        const decoder = new TextDecoder()
        const reader = stream.getReader()
        let fullResponse = ""

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                fullResponse += decoder.decode(value, { stream: true })
            }
        } finally {
            reader.releaseLock()
        }

        // Salvar resposta do assistente
        if (threadId) {
            await saveMessage(userId, threadId, "assistant", fullResponse, channel)
        }

        return fullResponse
    }
}

/**
 * Processa mensagem de forma síncrona (para WhatsApp)
 */
export async function processMessageSync(
    message: string,
    phone: string
): Promise<string> {
    try {
        // Obter ou criar conversa
        const conversationId = await getOrCreateWhatsAppConversation(phone)

        // Processar mensagem
        const response = await processMessage({
            message,
            userId: phone,
            channel: "whatsapp",
            threadId: conversationId,
            streaming: false,
        })

        return response as string
    } catch (error) {
        console.error("[AI Agent] Erro ao processar mensagem WhatsApp via AGNO:", error)
        return "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
    }
}
