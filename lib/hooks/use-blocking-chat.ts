'use client'

/**
 * useBlockingChat - Hook for non-streaming chat with AI SDK
 *
 * Replaces useChat for blocking (non-streaming) responses.
 * Uses fetch + state management instead of streaming.
 */

import { useState, useCallback, useRef } from 'react'
import { generateId } from 'ai'
import type { UIMessage } from 'ai'

interface UseBlockingChatOptions {
  api?: string
  initialMessages?: UIMessage[]
  agentId?: string
  sessionId?: string
  onError?: (error: Error) => void
  onFinish?: (message: UIMessage, response: BlockingChatResponse) => void
  onSessionCreated?: (sessionId: string) => void
}

interface BlockingChatResponse {
  message: UIMessage
  sessionId?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  toolResults?: unknown[]
}

type ChatStatus = 'ready' | 'submitted' | 'error'

interface UseBlockingChatReturn {
  messages: UIMessage[]
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
  isLoading: boolean
  status: ChatStatus
  error: Error | null
  sessionId: string | undefined
  sendMessage: (content: string, attachments?: File[]) => Promise<void>
  append: (message: { role: 'user' | 'assistant'; content: string }, attachments?: File[]) => Promise<void>
  reload: () => Promise<void>
  stop: () => void
}

// Helper to convert File to base64 data URL
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper to normalize message to UIMessage format
function normalizeMessage(msg: UIMessage): UIMessage {
  // Ensure parts array exists
  if (!msg.parts || msg.parts.length === 0) {
    // Try to recover from legacy 'content' field
    const legacyContent = (msg as unknown as { content?: string }).content
    if (typeof legacyContent === 'string') {
      return {
        ...msg,
        parts: [{ type: 'text', text: legacyContent }],
      }
    }
    return {
      ...msg,
      parts: [{ type: 'text', text: '' }],
    }
  }
  return msg
}

export function useBlockingChat({
  api = '/api/chat',
  initialMessages = [],
  agentId = 'odonto-gpt',
  sessionId: initialSessionId,
  onError,
  onFinish,
  onSessionCreated,
}: UseBlockingChatOptions = {}): UseBlockingChatReturn {
  // Normalize initial messages on first render
  const [messages, setMessages] = useState<UIMessage[]>(() =>
    initialMessages.map(normalizeMessage)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Refs para evitar dependencias circulares no useCallback
  const isLoadingRef = useRef(false)
  const messagesRef = useRef<UIMessage[]>(initialMessages.map(normalizeMessage))
  const currentSessionIdRef = useRef<string | undefined>(initialSessionId)

  // Manter refs sincronizadas com estado
  isLoadingRef.current = isLoading
  messagesRef.current = messages
  currentSessionIdRef.current = currentSessionId

  const status: ChatStatus = isLoading ? 'submitted' : error ? 'error' : 'ready'

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      // Usar ref para verificar isLoading para evitar re-renders
      if ((!content.trim() && !attachments?.length) || isLoadingRef.current) return

      setIsLoading(true)
      setError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      // Build parts array
      const parts: UIMessage['parts'] = []

      // Add image attachments first (AI SDK pattern)
      if (attachments?.length) {
        for (const file of attachments) {
          if (file.type.startsWith('image/')) {
            const dataUrl = await fileToBase64(file)
            parts.push({
              type: 'file',
              mediaType: file.type,
              filename: file.name,
              url: dataUrl,
            } as any)
          }
        }
      }

      // Add text content
      if (content.trim()) {
        parts.push({ type: 'text', text: content })
      }

      // Create user message with parts
      const userMessage: UIMessage = {
        id: generateId(),
        role: 'user',
        parts,
      }

      // Add user message immediately for instant feedback
      setMessages((prev) => [...prev, userMessage])

      try {
        // Usar ref para acessar mensagens atuais sem dependencia
        const currentMessages = messagesRef.current
        const apiMessages = [...currentMessages, userMessage].map(normalizeMessage).map(msg => ({
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
        }))

        console.log('[useBlockingChat] Sending messages:', apiMessages.length)

        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            agentId,
            sessionId: currentSessionIdRef.current,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to process message`)
        }

        const data: BlockingChatResponse = await response.json()

        // Update sessionId if server created a new one
        if (data.sessionId && data.sessionId !== currentSessionIdRef.current) {
          console.log('[useBlockingChat] New session created:', data.sessionId)
          setCurrentSessionId(data.sessionId)
          onSessionCreated?.(data.sessionId)
        }

        // Add assistant response
        setMessages((prev) => [...prev, data.message])

        onFinish?.(data.message, data)
      } catch (err) {
        // Don't treat abort as error
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setError(error)
        onError?.(error)
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [api, agentId, onError, onFinish, onSessionCreated]
  )

  // Append message (compatible with useChat API)
  const append = useCallback(
    async (message: { role: 'user' | 'assistant'; content: string }, attachments?: File[]) => {
      if (message.role === 'user') {
        await sendMessage(message.content, attachments)
      } else {
        // For assistant messages, just add to state
        const assistantMessage: UIMessage = {
          id: generateId(),
          role: 'assistant',
          parts: [{ type: 'text', text: message.content }],
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    },
    [sendMessage]
  )

  // Reload last message (regenerate)
  const reload = useCallback(async () => {
    // Usar ref para acessar mensagens atuais
    const currentMessages = messagesRef.current

    // Find last user message
    const lastUserMessageIndex = currentMessages.findLastIndex((m) => m.role === 'user')
    if (lastUserMessageIndex === -1) return

    // Get the text from last user message
    const lastUserMessage = currentMessages[lastUserMessageIndex]
    const textPart = lastUserMessage.parts?.find(
      (p): p is { type: 'text'; text: string } => 'type' in p && p.type === 'text' && 'text' in p
    )

    // For reload, we can't regenerate file attachments (they were File objects)
    // So we just reload the text portion
    const textContent = textPart?.text || ''

    // Remove messages after the last user message (including any assistant response)
    setMessages((prev) => prev.slice(0, lastUserMessageIndex))

    // Re-send the message (without attachments - they're not available anymore)
    await sendMessage(textContent)
  }, [sendMessage])

  // Stop/abort current request
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }, [])

  return {
    messages,
    setMessages,
    isLoading,
    status,
    error,
    sessionId: currentSessionId,
    sendMessage,
    append,
    reload,
    stop,
  }
}
