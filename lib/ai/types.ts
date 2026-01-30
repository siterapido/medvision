/**
 * Tipos para o sistema de IA do Odonto GPT
 */

export type AIChannel = "web" | "whatsapp"

export type AIMessageRole = "user" | "assistant" | "system"

export interface AIMessage {
    id?: string
    role: AIMessageRole
    content: string
    createdAt?: Date
}

export interface ProcessMessageOptions {
    message: string
    userId: string
    channel: AIChannel
    threadId?: string
    streaming?: boolean
    metadata?: Record<string, unknown>
}

export interface AISettings {
    id: string
    system_prompt: string
    model: string
    max_tokens: number
    temperature: number
    whatsapp_enabled: boolean
    web_chat_enabled: boolean
    created_at: string
    updated_at: string
}

export interface WhatsAppConversation {
    id: string
    phone: string
    last_message_at: string
    metadata: Record<string, unknown>
    created_at: string
}

export interface WhatsAppMessage {
    id: string
    conversation_id: string
    role: AIMessageRole
    content: string
    metadata: Record<string, unknown>
    created_at: string
}

/**
 * Tipos para webhooks Z-API
 */
export interface ZApiWebhookMessage {
    phone: string
    fromMe: boolean
    momment: number
    status: string
    chatName: string
    senderPhoto?: string
    senderName?: string
    participantPhone?: string
    messageId: string
    photo?: string
    broadcast: boolean
    isGroup: boolean
    text?: {
        message: string
    }
    image?: {
        imageUrl: string
        caption?: string
        mimeType: string
    }
    audio?: {
        audioUrl: string
        mimeType: string
    }
    document?: {
        documentUrl: string
        mimeType: string
        fileName: string
    }
}

export interface ZApiWebhookPayload {
    instanceId: string
    phone: string
    type: "ReceivedCallback" | "MessageStatusCallback" | string
    body: ZApiWebhookMessage
}
