/**
 * Tipos compartilhados para componentes de chat AG-UI
 */

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp?: Date
    agentId?: string
    metadata?: Record<string, unknown>
}

export interface ChatSource {
    title: string
    url: string
    pmid?: string
    type?: "article" | "guideline" | "textbook"
}

export interface ArtifactResult {
    id: string
    type: "summary" | "research" | "flashcard" | "mindmap" | "quiz"
    title: string
    createdAt: Date
}

export interface AgentChatState {
    status: "idle" | "thinking" | "streaming" | "tool_calling" | "completed" | "error"
    progress: number
    currentAction?: string
    sources?: ChatSource[]
    artifact?: ArtifactResult
    error?: string
}

export interface AgentChatPanelProps {
    agentId: string
    userId: string
    title?: string
    subtitle?: string
    placeholder?: string
    suggestions?: string[]
    onArtifactCreated?: (artifact: ArtifactResult) => void
    className?: string
    compact?: boolean
}

export interface UseAgentChatOptions {
    agentId: string
    userId: string
    onArtifactCreated?: (artifact: ArtifactResult) => void
}

export interface UseAgentChatReturn {
    messages: ChatMessage[]
    state: AgentChatState
    sendMessage: (content: string) => Promise<void>
    clearMessages: () => void
    isStreaming: boolean
}
