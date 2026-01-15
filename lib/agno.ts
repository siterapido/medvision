/**
 * Agno AgentOS Configuration and Types
 * 
 * This file contains all the types and helpers for communicating
 * with the Agno AgentOS API.
 */

// ============================================================================
// Configuration
// ============================================================================

export const AGNO_CONFIG = {
    // Base URL for AgentOS - can be overridden by env variable
    baseUrl: process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://127.0.0.1:8000/api/v1",

    // Endpoints
    endpoints: {
        health: "/health",
        agents: "/agents",
        agentRun: (agentId: string) => `/agents/${agentId}/runs`,
        sessions: "/sessions",
        sessionRuns: (sessionId: string) => `/sessions/${sessionId}/runs`,
    }
} as const

// ============================================================================
// Run Events (from AgentOS)
// ============================================================================

export enum RunEvent {
    // Agent events
    RunStarted = "RunStarted",
    RunContent = "RunResponse",
    RunCompleted = "RunCompleted",
    RunError = "RunError",

    // Tool events
    ToolCallStarted = "ToolCallStarted",
    ToolCallCompleted = "ToolCallCompleted",

    // Reasoning events
    ReasoningStarted = "ReasoningStarted",
    ReasoningStep = "ReasoningStep",
    ReasoningCompleted = "ReasoningCompleted",

    // Memory events
    UpdatingMemory = "UpdatingMemory",

    // Team events (if using teams)
    TeamRunStarted = "TeamRunStarted",
    TeamRunContent = "TeamRunResponse",
    TeamRunCompleted = "TeamRunCompleted",
    TeamRunError = "TeamRunError",
    TeamToolCallStarted = "TeamToolCallStarted",
    TeamToolCallCompleted = "TeamToolCallCompleted",
    TeamReasoningStarted = "TeamReasoningStarted",
    TeamReasoningStep = "TeamReasoningStep",
    TeamReasoningCompleted = "TeamReasoningCompleted",
    TeamMemoryUpdateStarted = "TeamMemoryUpdateStarted",
    TeamMemoryUpdateCompleted = "TeamMemoryUpdateCompleted",
    TeamRunCancelled = "TeamRunCancelled",
}

// ============================================================================
// Types
// ============================================================================

export interface AgentDetails {
    id: string
    name: string
    description?: string
    model?: {
        model?: string
        provider?: string
    }
    db_id?: string
}

export interface ToolCall {
    tool_call_id?: string
    tool_name?: string
    tool_args?: Record<string, unknown>
    content?: string
    created_at?: number
    result?: string
}

export interface RunResponseChunk {
    event: RunEvent | string
    content?: string
    session_id?: string
    run_id?: string
    created_at?: number
    tool?: ToolCall
    tools?: ToolCall[]
    images?: string[]
    videos?: string[]
    audio?: unknown
    response_audio?: {
        transcript?: string
    }
    extra_data?: {
        reasoning_steps?: string[]
        references?: unknown[]
    }
    metrics?: {
        total_tokens?: number
        prompt_tokens?: number
        completion_tokens?: number
    }
}

export interface ChatMessage {
    id: string
    role: "user" | "agent"
    content: string
    created_at: number
    agent_id?: string  // ID do agente que respondeu (dr-ciencia, prof-estudo, dr-redator, etc)
    tool_calls?: ToolCall[]
    images?: string[]
    videos?: string[]
    audio?: unknown
    response_audio?: {
        transcript?: string
    }
    extra_data?: {
        reasoning_steps?: string[]
        references?: unknown[]
    }
    streamingError?: boolean
    isStreaming?: boolean
}

export interface SessionEntry {
    session_id: string
    session_name: string
    created_at?: number
}

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Fetch agents from AgentOS
 */
export async function fetchAgents(baseUrl?: string): Promise<AgentDetails[]> {
    const url = `${baseUrl || AGNO_CONFIG.baseUrl}${AGNO_CONFIG.endpoints.agents}`

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch agents: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error("[Agno] Error fetching agents:", error)
        return []
    }
}

/**
 * Check AgentOS health
 */
export async function checkHealth(baseUrl?: string): Promise<boolean> {
    const url = `${baseUrl || AGNO_CONFIG.baseUrl}${AGNO_CONFIG.endpoints.health}`

    try {
        const response = await fetch(url, { method: "GET" })
        return response.ok
    } catch {
        return false
    }
}

/**
 * Parse SSE line to extract event data
 */
export function parseSSELine(line: string): RunResponseChunk | null {
    if (!line.startsWith("data: ")) {
        return null
    }

    const data = line.slice(6) // Remove "data: " prefix

    if (data === "[DONE]") {
        return null
    }

    try {
        return JSON.parse(data) as RunResponseChunk
    } catch {
        console.warn("[Agno] Failed to parse SSE data:", data)
        return null
    }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
