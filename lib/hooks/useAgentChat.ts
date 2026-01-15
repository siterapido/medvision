"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage, AgentChatState, ArtifactResult, UseAgentChatOptions, UseAgentChatReturn } from "@/components/chat/types"

/**
 * Hook genérico para chat com agente Agno específico
 * Gerencia estado de mensagens, streaming e detecção de artefatos
 */
export function useAgentChat({
    agentId,
    userId,
    onArtifactCreated
}: UseAgentChatOptions): UseAgentChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [state, setState] = useState<AgentChatState>({
        status: "idle",
        progress: 0
    })
    const abortControllerRef = useRef<AbortController | null>(null)

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || state.status === "streaming") return

        // Add user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: content.trim(),
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])

        // Start streaming state
        setState({
            status: "thinking",
            progress: 10,
            currentAction: "Processando..."
        })

        try {
            const agnoServiceUrl = process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://127.0.0.1:8000"
            const baseUrl = agnoServiceUrl.replace(/\/$/, "")

            // Map agent IDs to backend endpoints
            const agentEndpoints: Record<string, string> = {
                "odonto-research": "dr-ciencia",
                "odonto-practice": "prof-estudo",
                "odonto-write": "dr-redator",
                "odonto-summary": "gerador-resumos",
                "odonto-vision": "odonto-vision",
                "odonto-flow": "flow"
            }

            const agentPath = agentEndpoints[agentId] || agentId

            // Build the URL safely - avoid double /api/v1
            let endpoint = ""
            if (baseUrl.endsWith("/api/v1")) {
                endpoint = `${baseUrl}/agentes/${agentPath}/chat`
            } else {
                endpoint = `${baseUrl}/api/v1/agentes/${agentPath}/chat`
            }

            abortControllerRef.current = new AbortController()

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: content,
                    userId,
                    context: { agentId }
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`)
            }

            setState(prev => ({ ...prev, status: "streaming", progress: 30 }))

            // Process streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantContent = ""
            let foundSources: AgentChatState["sources"] = []
            let createdArtifact: ArtifactResult | undefined

            while (reader) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n").filter(Boolean)

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line)

                        // Handle text content
                        if (data.type === "text" || data.content) {
                            assistantContent += data.content || data.text || ""
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMsg = newMessages[newMessages.length - 1]
                                if (lastMsg?.role === "assistant") {
                                    lastMsg.content = assistantContent
                                } else {
                                    newMessages.push({
                                        id: `assistant-${Date.now()}`,
                                        role: "assistant",
                                        content: assistantContent,
                                        timestamp: new Date(),
                                        agentId
                                    })
                                }
                                return newMessages
                            })
                            setState(prev => ({ ...prev, progress: Math.min(prev.progress + 5, 80) }))
                        }

                        // Handle sources
                        if (data.sources) {
                            foundSources = [...foundSources, ...data.sources]
                            setState(prev => ({ ...prev, sources: foundSources }))
                        }

                        // Handle artifact creation (tool result)
                        if (data.tool_name && data.result) {
                            setState(prev => ({ ...prev, status: "tool_calling", currentAction: `Executando ${data.tool_name}...` }))

                            try {
                                const result = typeof data.result === "string" ? JSON.parse(data.result) : data.result
                                if (result.success && result.artifact) {
                                    createdArtifact = {
                                        id: result.artifact.id,
                                        type: result.artifact.type || "summary",
                                        title: result.artifact.title || "Artefato criado",
                                        createdAt: new Date()
                                    }
                                    setState(prev => ({ ...prev, artifact: createdArtifact }))
                                    onArtifactCreated?.(createdArtifact)
                                }
                            } catch {
                                // Result parsing failed, continue
                            }
                        }
                    } catch {
                        // Line might not be JSON, continue
                    }
                }
            }

            setState(prev => ({
                ...prev,
                status: "completed",
                progress: 100,
                currentAction: undefined
            }))

        } catch (error) {
            if ((error as Error).name === "AbortError") return

            console.error("Agent chat error:", error)
            setState({
                status: "error",
                progress: 0,
                error: error instanceof Error ? error.message : "Erro desconhecido"
            })

            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "Desculpe, ocorreu um erro. Tente novamente.",
                timestamp: new Date()
            }])
        }
    }, [agentId, userId, state.status, onArtifactCreated])

    const clearMessages = useCallback(() => {
        abortControllerRef.current?.abort()
        setMessages([])
        setState({ status: "idle", progress: 0 })
    }, [])

    return {
        messages,
        state,
        sendMessage,
        clearMessages,
        isStreaming: state.status === "streaming" || state.status === "thinking" || state.status === "tool_calling"
    }
}
