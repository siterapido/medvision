"use client"

import { useState, useCallback, useRef } from "react"
import { useCopilotContext } from "@copilotkit/react-core"
import {
    generateMessageId,
    type ChatMessage,
    type AgentDetails,
    type SessionEntry,
} from "@/lib/agno"
import { AGENT_IDS } from "@/lib/constants"

interface UseAgnoChatOptions {
    baseUrl?: string
    userId: string
    onArtifactCreated?: (artifact: any) => void
    onError?: (error: string) => void
}

interface UseAgnoChatReturn {
    messages: ChatMessage[]
    sessionId: string | null
    sessions: SessionEntry[]
    isStreaming: boolean
    isLoadingSessions: boolean
    error: string | null
    sendMessage: (message: string, agent: AgentDetails, imageUrl?: string) => Promise<void>
    clearChat: () => void
    loadSession: (sessionId: string) => Promise<void>
    loadSessions: () => Promise<void>
}

/**
 * Hook for managing chat with Custom Agno Service
 * Handles streaming responses and session management
 */
export function useAgnoChat(options: UseAgnoChatOptions): UseAgnoChatReturn {
    const {
        baseUrl = process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://localhost:8000/api/v1",
        userId,
        onArtifactCreated,
        onError
    } = options

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessions, setSessions] = useState<SessionEntry[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [isLoadingSessions, setIsLoadingSessions] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { actions } = useCopilotContext()

    const abortControllerRef = useRef<AbortController | null>(null)

    /**
     * Send a message to the agent and stream the response
     */
    /**
     * Send a message to the agent and stream the response
     */
    const sendMessage = useCallback(
        async (message: string, agent: AgentDetails, imageUrl?: string) => {
            if ((!message.trim() && !imageUrl) || isStreaming) return

            setError(null)
            setIsStreaming(true)

            let currentSessionId = sessionId

            // Generate temporary message ID for UI optimistic update
            const userMessageId = generateMessageId()
            const agentMessageId = generateMessageId()

            // Optimistic UI updates
            const userMessage: ChatMessage = {
                id: userMessageId,
                role: "user",
                content: message,
                created_at: Math.floor(Date.now() / 1000),
                images: imageUrl ? [imageUrl] : undefined
            }

            setMessages((prev) => [...prev, userMessage])

            const agentMessageStub: ChatMessage = {
                id: agentMessageId,
                role: "agent",
                content: "",
                created_at: Math.floor(Date.now() / 1000),
                isStreaming: true,
            }
            setMessages((prev) => [...prev, agentMessageStub])

            // Abort any existing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            abortControllerRef.current = new AbortController()

            try {
                // 1. Create session if it doesn't exist
                if (!currentSessionId) {
                    try {
                        const sessionRes = await fetch(`${baseUrl}/sessions`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId,
                                agentType: agent.id === AGENT_IDS.VISION ? AGENT_IDS.VISION : AGENT_IDS.QA,
                                metadata: {
                                    title: message.substring(0, 50) + (message.length > 50 ? "..." : "")
                                }
                            })
                        })

                        if (!sessionRes.ok) {
                            throw new Error("Failed to create session")
                        }

                        const sessionData = await sessionRes.json()
                        currentSessionId = sessionData.id
                        setSessionId(currentSessionId)

                        // Add to sessions list immediately
                        const newSessionEntry: SessionEntry = {
                            session_id: sessionData.id,
                            session_name: sessionData.metadata?.title || "Nova Conversa",
                            created_at: Math.floor(Date.now() / 1000)
                        }
                        setSessions((prev) => [newSessionEntry, ...prev])
                    } catch (err) {
                        console.error("Error creating session:", err)
                        throw new Error("Erro ao iniciar sessão de chat")
                    }
                }

                // 2. Determine the correct endpoint
                // SIMPLIFICADO: Usar sempre /equipe/chat com forceAgent
                // O backend cuida do roteamento (automático ou forçado)
                let endpoint = "/equipe/chat"

                // Exceção: análise de imagem usa endpoint específico
                if (agent.id === AGENT_IDS.VISION) {
                    endpoint = "/image/analyze"
                }

                // 3. Send message to appropriate endpoint
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message,
                        imageUrl,
                        userId,
                        sessionId: currentSessionId,
                        agentType: agent.id === AGENT_IDS.VISION ? AGENT_IDS.VISION : AGENT_IDS.QA,
                        // Se não for odonto-flow, forçar o agente específico (bypass de roteamento)
                        forceAgent: agent.id !== AGENT_IDS.FLOW ? agent.id : undefined,
                        // Context must be an object, not a string (backend expects Dict[str, Any])
                        context: {},
                    }),
                    signal: abortControllerRef.current.signal,
                })

                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.statusText}`)
                }



                const reader = response.body?.getReader()
                if (!reader) {
                    throw new Error("Não foi possível ler a resposta")
                }

                const decoder = new TextDecoder()
                let buffer = ""

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })

                    // Split by newlines to process NDJSON
                    const lines = buffer.split('\n')

                    // Keep the last chunk in buffer if it's not a complete line
                    buffer = lines.pop() || ""

                    for (const line of lines) {
                        if (!line.trim()) continue

                        try {
                            const event = JSON.parse(line)

                            switch (event.type) {
                                case "run.started":
                                    // Could handle run start
                                    break

                                case "agent.switch": {
                                    const rawAgentId = event.agentId || event.agent_id;
                                    if (rawAgentId) {
                                        // Usar o ID retornado pelo backend diretamente
                                        // O backend já garante o formato correto (odonto-research, odonto-practice, etc)
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === agentMessageId
                                                    ? { ...msg, agent_id: rawAgentId }
                                                    : msg
                                            )
                                        )
                                    }
                                    break;
                                }

                                case "text.delta":
                                    setMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === agentMessageId
                                                ? { ...msg, content: (msg.content || "") + event.content }
                                                : msg
                                        )
                                    )
                                    break

                                case "artifact.created":
                                    console.log("Artifact created:", event.artifact)
                                    if (onArtifactCreated) {
                                        onArtifactCreated(event.artifact)
                                    }
                                    break

                                case "tool_call.start":
                                    // Intercept for CopilotKit Actions (Frontend Actions)
                                    if (event.toolCallName && actions[event.toolCallName]) {
                                        try {
                                            const args = typeof event.args === 'string' ? JSON.parse(event.args) : (event.args || {});
                                            console.log(`[CopilotAction] Triggering ${event.toolCallName}`, args);
                                            actions[event.toolCallName].handler(args);
                                        } catch (e) {
                                            console.error(`Failed to trigger Copilot action ${event.toolCallName}:`, e);
                                        }
                                    }

                                    setMessages((prev) =>
                                        prev.map((msg) => {
                                            if (msg.id === agentMessageId) {
                                                const newToolCalls = [...(msg.tool_calls || [])]
                                                newToolCalls.push({
                                                    tool_call_id: event.toolCallId,
                                                    tool_name: event.toolCallName,
                                                    result: undefined // In progress
                                                })
                                                return { ...msg, tool_calls: newToolCalls }
                                            }
                                            return msg
                                        })
                                    )
                                    break

                                case "tool_call.result":
                                    // Handle artifact detection from tool result
                                    const toolName = event.toolCallName || "";
                                    const result = event.result || "";

                                    if (result && typeof result === 'string' && result.includes('"success": true')) {
                                        try {
                                            const parsed = JSON.parse(result);
                                            if (parsed.artifact && onArtifactCreated) {
                                                console.log("[useAgnoChat] Artefato detectado via tool result:", parsed.artifact);
                                                onArtifactCreated(parsed.artifact);
                                            }
                                        } catch (e) {
                                            // Ignore parsing error
                                        }
                                    }

                                    setMessages((prev) =>
                                        prev.map((msg) => {
                                            if (msg.id === agentMessageId && msg.tool_calls && msg.tool_calls.length > 0) {
                                                const newToolCalls = [...msg.tool_calls]
                                                // Try to match by name or ID if available, otherwise use last one
                                                const toolIndex = event.toolCallId !== "unknown"
                                                    ? newToolCalls.findIndex(tc => tc.tool_call_id === event.toolCallId)
                                                    : newToolCalls.findLastIndex(tc => tc.tool_name === toolName && tc.result === undefined);

                                                const indexToUpdate = toolIndex !== -1 ? toolIndex : newToolCalls.findLastIndex(tc => tc.result === undefined);

                                                if (indexToUpdate !== -1) {
                                                    newToolCalls[indexToUpdate] = { ...newToolCalls[indexToUpdate], result: result };
                                                }
                                                return { ...msg, tool_calls: newToolCalls }
                                            }
                                            return msg
                                        })
                                    )
                                    break

                                case "error":
                                    throw new Error(event.message)
                            }
                        } catch (e) {
                            // Fallback for non-JSON lines (legacy support or plain text)
                            // Treat as raw text if parsing fails (useful during migration)
                            console.warn("Failed to parse event:", line, e)
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === agentMessageId
                                        ? { ...msg, content: (msg.content || "") + line }
                                        : msg
                                )
                            )
                        }
                    }
                }

                // Process remaining buffer
                if (buffer.trim()) {
                    try {
                        const event = JSON.parse(buffer)
                        if (event.type === "text.delta") {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === agentMessageId
                                        ? { ...msg, content: (msg.content || "") + event.content }
                                        : msg
                                )
                            )
                        }
                    } catch (e) {
                        // ignore or append
                    }
                }

            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    return // Ignore abort errors
                }

                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
                setError(errorMessage)
                onError?.(errorMessage)

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === agentMessageId
                            ? { ...msg, content: errorMessage, streamingError: true, isStreaming: false }
                            : msg
                    )
                )
            } finally {
                setIsStreaming(false)

                // Final update to unset streaming flag
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === agentMessageId
                            ? { ...msg, isStreaming: false }
                            : msg
                    )
                )

                abortControllerRef.current = null
            }
        },
        [baseUrl, userId, sessionId, isStreaming, onError]
    )

    /**
     * Clear chat and start new session
     */
    const clearChat = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setMessages([])
        setSessionId(null)
        setError(null)
        setIsStreaming(false)
    }, [])

    /**
     * Load existing sessions
     */
    const loadSessions = useCallback(async () => {
        if (!userId) return

        setIsLoadingSessions(true)
        try {
            const response = await fetch(`${baseUrl}/sessions?userId=${userId}`)

            if (!response.ok) {
                // If 404/500, just allow empty sessions
                console.warn("Failed to load sessions")
                return
            }

            const data = await response.json()

            // Map backend session objects to SessionEntry
            const mappedSessions: SessionEntry[] = data.map((s: any) => ({
                session_id: s.id,
                session_name: s.metadata?.title || s.agent_type || "Conversa Sem Título",
                created_at: new Date(s.created_at).getTime() / 1000
            }))

            setSessions(mappedSessions)
        } catch (error) {
            console.error("Error loading sessions:", error)
        } finally {
            setIsLoadingSessions(false)
        }
    }, [baseUrl, userId])

    /**
     * Load messages from an existing session
     */
    const loadSession = useCallback(
        async (targetSessionId: string) => {
            if (isStreaming) return // Prevent switching while streaming

            try {
                // First clear current chat
                setMessages([])
                setError(null)

                const response = await fetch(`${baseUrl}/sessions/${targetSessionId}`)

                if (!response.ok) {
                    throw new Error("Erro ao carregar sessão")
                }

                const data = await response.json()

                if (data && data.messages) {
                    const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        created_at: msg.createdAt || Date.now() / 1000,
                        agent_id: msg.agentId || msg.agent_id,  // Extrair agent_id do backend
                        tool_calls: msg.toolCalls,
                        images: msg.metadata?.images,
                    }))

                    setMessages(loadedMessages)
                    setSessionId(targetSessionId)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro ao carregar sessão"
                setError(errorMessage)
                onError?.(errorMessage)
            }
        },
        [baseUrl, isStreaming, onError]
    )

    return {
        messages,
        sessionId,
        sessions,
        isStreaming,
        isLoadingSessions,
        error,
        sendMessage,
        clearChat,
        loadSession,
        loadSessions
    }
}
