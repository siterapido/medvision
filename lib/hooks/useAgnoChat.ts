"use client"

import { useState, useCallback, useRef } from "react"
import {
    generateMessageId,
    type ChatMessage,
    type AgentDetails,
    type SessionEntry,
} from "@/lib/agno"

interface UseAgnoChatOptions {
    baseUrl?: string
    userId: string
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
        onError
    } = options

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessions, setSessions] = useState<SessionEntry[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [isLoadingSessions, setIsLoadingSessions] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                                agentType: agent.id === "image-analysis" ? "image-analysis" : "qa",
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

                // 2. Send message to chat endpoint
                const endpoint = "/chat"

                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message,
                        imageUrl,
                        userId,
                        sessionId: currentSessionId, // Use the ensured session ID
                        agentType: agent.id === "image-analysis" ? "image-analysis" : "qa",
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
                let fullContent = ""

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunkText = decoder.decode(value, { stream: true })
                    fullContent += chunkText

                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === agentMessageId
                                ? { ...msg, content: fullContent }
                                : msg
                        )
                    )
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
                        role: msg.role === "user" ? "user" : "agent",
                        content: msg.content || "",
                        created_at: new Date(msg.createdAt).getTime() / 1000,
                        images: msg.metadata?.images,
                        tool_calls: msg.toolCalls
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
