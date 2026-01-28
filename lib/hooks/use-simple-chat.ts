import { useState, useCallback } from 'react'
import { generateId, UIMessage } from 'ai'

interface UseSimpleChatOptions {
    api?: string
    initialMessages?: UIMessage[]
    sessionId?: string
    onSessionCreated?: (id: string) => void
}

export function useSimpleChat({
    api = '/api/chat',
    initialMessages = [],
    sessionId: initialSessionId,
    onSessionCreated
}: UseSimpleChatOptions = {}) {
    const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        const userMsg: UIMessage = { id: generateId(), role: 'user', parts: [{ type: 'text', text: content }] }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        try {
            const res = await fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg], sessionId })
            })

            if (!res.ok) throw new Error('Falha ao enviar mensagem')
            const data = await res.json()

            if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId)
                onSessionCreated?.(data.sessionId)
            }

            setMessages(prev => [...prev, data.message])
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [api, messages, sessionId, onSessionCreated, isLoading])

    return { messages, setMessages, isLoading, sessionId, sendMessage }
}
