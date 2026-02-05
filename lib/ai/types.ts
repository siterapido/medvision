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
 * @see https://developer.z-api.io/en/webhooks/on-message-received
 */
export interface ZApiWebhookMessage {
    phone: string
    fromMe: boolean
    momment: number
    status: string
    chatName: string
    senderPhoto?: string
    senderName?: string
    senderLid?: string
    participantPhone?: string
    messageId: string
    photo?: string
    broadcast: boolean
    isGroup: boolean
    isNewsletter?: boolean
    waitingMessage?: boolean
    isEdit?: boolean
    text?: {
        message: string
        title?: string
        description?: string
        url?: string
        thumbnailUrl?: string
    }
    image?: {
        imageUrl: string
        thumbnailUrl?: string
        caption?: string
        mimeType: string
    }
    audio?: {
        audioUrl: string
        mimeType: string
        ptt?: boolean
    }
    video?: {
        videoUrl: string
        mimeType: string
        caption?: string
        seconds?: number
    }
    document?: {
        documentUrl: string
        mimeType: string
        fileName: string
        pageCount?: number
    }
    reaction?: {
        value: string
        referencedMessage?: {
            messageId: string
            fromMe: boolean
        }
    }
    buttonsResponseMessage?: {
        buttonId: string
        message: string
    }
    listResponseMessage?: {
        selectedRowId: string
        title: string
        description?: string
    }
    notification?: string
}

export type ZApiWebhookType =
    | "ReceivedCallback"
    | "MessageStatusCallback"
    | "ConnectedCallback"
    | "DisconnectedCallback"
    | string

export interface ZApiWebhookPayload {
    instanceId: string
    phone: string
    type: ZApiWebhookType
    body: ZApiWebhookMessage
}
