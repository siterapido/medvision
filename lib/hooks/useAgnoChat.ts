"use client"

import { useState, useCallback, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, UIMessage } from "ai"
import { createClient } from "@/lib/supabase/client"
import {
    type ChatMessage,
    type AgentDetails,
    type SessionEntry,
} from "@/lib/agno"

interface UseAgnoChatOptions {
    baseUrl?: string // Deprecated but kept for compatibility
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

export function useAgnoChat(options: UseAgnoChatOptions): UseAgnoChatReturn {
    const { userId, onArtifactCreated, onError } = options
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessions, setSessions] = useState<SessionEntry[]>([])
    const [isLoadingSessions, setIsLoadingSessions] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentAgentId, setCurrentAgentId] = useState<string>('medvision')

    // Supabase client
    const supabase = createClient()

    const { messages, sendMessage: sendChatMessage, setMessages, status, stop } = useChat<UIMessage>({
        id: sessionId || undefined,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: {
                userId,
                sessionId,
                agentId: currentAgentId
            },
        }),
        onFinish: ({ message }) => {
            // Check for tool invocations that created artifacts
            if (message.parts) {
                message.parts.forEach((part: any) => {
                    if (part.type?.startsWith('tool-') && part.state === 'output-available') {
                        try {
                            const resultStr = typeof part.output === 'string' ? part.output : JSON.stringify(part.output);
                            if (resultStr.includes('"success": true')) {
                                 const result = JSON.parse(resultStr);
                                 if (result.artifact && onArtifactCreated) {
                                     onArtifactCreated(result.artifact);
                                 }
                            }
                        } catch (e) { 
                            // ignore parse errors
                        }
                    }
                })
            }
        },
        onError: (err) => {
            setError(err.message)
            onError?.(err.message)
        },
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    // Map AI SDK messages to Agno ChatMessage format for UI compatibility
    const mappedMessages: ChatMessage[] = messages.map((m) => {
        let content = '';
        if (m.parts) {
            const textPart = m.parts.find((p: any) => p.type === 'text');
            content = (textPart as any)?.text || '';
        }
        
        return {
            id: m.id,
            role: m.role === 'assistant' ? 'agent' : m.role as any,
            content,
            created_at: Date.now() / 1000,
            isStreaming: isLoading && m.id === messages[messages.length - 1]?.id,
            tool_calls: m.parts?.filter((p: any) => p.type?.startsWith('tool-')).map((t: any) => ({
                tool_call_id: t.toolCallId,
                tool_name: t.toolName,
                tool_args: t.input,
                result: t.state === 'output-available' ? (typeof t.output === 'string' ? t.output : JSON.stringify(t.output)) : undefined
            }))
        }
    })

    const sendMessage = useCallback(async (message: string, agent: AgentDetails, _imageUrl?: string) => {
        setError(null);
        setCurrentAgentId(agent.id);
        
        // Send message using the new API
        sendChatMessage({
            role: 'user',
            parts: [{ type: 'text', text: message }],
        });
    }, [sendChatMessage]);

    const clearChat = useCallback(() => {
        stop();
        setMessages([]);
        setSessionId(null);
        setError(null);
    }, [stop, setMessages]);

    const loadSessions = useCallback(async () => {
        if (!userId) return
        setIsLoadingSessions(true)
        try {
            const { data, error: fetchError } = await supabase
                .from('agent_sessions')
                .select('id, metadata, created_at, agent_type')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const mappedSessions: SessionEntry[] = (data || []).map((s: any) => ({
                session_id: s.id,
                session_name: s.metadata?.title || s.agent_type || "Nova Conversa",
                created_at: new Date(s.created_at).getTime() / 1000
            }));

            setSessions(mappedSessions);
        } catch (err: any) {
            console.error("Error loading sessions:", err)
        } finally {
            setIsLoadingSessions(false)
        }
    }, [userId, supabase]);

    const loadSession = useCallback(async (targetSessionId: string) => {
        if (isLoading) return; // Prevent switching while streaming

        try {
            setMessages([]); // Clear current
            setError(null);
            setSessionId(targetSessionId);

            // Fetch messages from Supabase
            const { data, error: fetchError } = await supabase
                .from('agent_messages')
                .select('*')
                .eq('session_id', targetSessionId)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            if (data) {
                const loadedMessages: UIMessage[] = data.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant',
                    parts: [{ type: 'text' as const, text: msg.content || "" }],
                }));
                
                setMessages(loadedMessages);
            }
        } catch (err: any) {
            setError(err.message);
            onError?.(err.message);
        }
    }, [isLoading, onError, setMessages, supabase]);

    // Initial load
    useEffect(() => {
        if (userId) {
            loadSessions();
        }
    }, [userId, loadSessions]);

    return {
        messages: mappedMessages,
        sessionId,
        sessions,
        isStreaming: isLoading,
        isLoadingSessions,
        error,
        sendMessage,
        clearChat,
        loadSession,
        loadSessions
    }
}
