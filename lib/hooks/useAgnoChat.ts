"use client"

import { useState, useCallback, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { createClient } from "@/lib/supabase/client"
import {
    type ChatMessage,
    type AgentDetails,
    type SessionEntry,
    generateMessageId,
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

    // Supabase client
    const supabase = createClient()

    const { messages, append, setMessages, isLoading, stop } = useChat({
        api: "/api/chat",
        id: sessionId || undefined,
        body: {
            userId,
            sessionId // Pass current session ID to reuse it on server
        },
        onFinish: (message: any) => {
            // Check for tool invocations that created artifacts
            message.toolInvocations?.forEach((tool: any) => {
                if (tool.state === 'result') {
                    try {
                        // The result is usually a stringified JSON
                        const resultStr = typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result);
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
        },
        onError: (err) => {
            setError(err.message)
            onError?.(err.message)
        },
        onResponse: (response: any) => {
            // Get session ID from header if available (created on server)
            const serverSessionId = response.headers.get('x-session-id')
            if (serverSessionId && !sessionId) {
                setSessionId(serverSessionId)
                // Refresh sessions list to show the new one
                loadSessions()
            }
        }
    })

    // Map AI SDK messages to Agno ChatMessage format for UI compatibility
    const mappedMessages: ChatMessage[] = messages.map((m: any) => ({
        id: m.id,
        role: m.role === 'assistant' ? 'agent' : m.role as any,
        content: m.content,
        created_at: m.createdAt ? new Date(m.createdAt).getTime() / 1000 : Date.now() / 1000,
        isStreaming: isLoading && m.id === messages[messages.length - 1].id,
        tool_calls: m.toolInvocations?.map((t: any) => ({
            tool_call_id: t.toolCallId,
            tool_name: t.toolName,
            tool_args: t.args,
            result: t.state === 'result' ? (typeof t.result === 'string' ? t.result : JSON.stringify(t.result)) : undefined
        }))
    }))

    const sendMessage = useCallback(async (message: string, agent: AgentDetails, imageUrl?: string) => {
        setError(null);
        
        // Prepare attachments if image is provided
        // Vercel AI SDK handles files/images via experimental_attachments or just plain text content if model supports it
        // We will assume using content array if image is present
        
        /* 
           NOTE: 'append' supports string | CreateMessage. 
           CreateMessage can have 'content' as string or array of parts.
        */

        const messageData: any = {
            role: 'user',
            content: message
        };

        // Note: For now, we are sending image URL as text or relying on future implementation of image upload
        // If imageUrl is a URL, we can pass it. 
        // Vercel AI SDK standard is evolving. We will pass it as a regular message for now or use the proper structure if supported.
        // For simplicity in migration, we'll append the image URL to text if present, or use experimental_attachments if configured.
        
        await append(messageData, {
            body: { 
                agentId: agent.id,
                sessionId 
            }
        });
    }, [append, sessionId]);

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
            const { data, error } = await supabase
                .from('agent_sessions')
                .select('id, metadata, created_at, agent_type')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedSessions: SessionEntry[] = data.map((s: any) => ({
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
            const { data, error } = await supabase
                .from('agent_messages')
                .select('*')
                .eq('session_id', targetSessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const loadedMessages: any[] = data.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content || "",
                    createdAt: new Date(msg.created_at),
                    toolInvocations: msg.tool_calls ? msg.tool_calls.map((tc: any) => ({
                        toolCallId: tc.tool_call_id || tc.id, // Adaptation
                        toolName: tc.tool_name || tc.function?.name,
                        args: tc.tool_args || JSON.parse(tc.function?.arguments || "{}"),
                        state: 'result',
                        result: tc.result || "Completed"
                    })) : undefined
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
