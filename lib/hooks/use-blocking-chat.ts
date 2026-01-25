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
  sendMessage: (content: string) => Promise<void>
  append: (message: { role: 'user' | 'assistant'; content: string }) => Promise<void>
  reload: () => Promise<void>
  stop: () => void
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
  sessionId,
  onError,
  onFinish,
}: UseBlockingChatOptions = {}): UseBlockingChatReturn {
  // Normalize initial messages on first render
  const [messages, setMessages] = useState<UIMessage[]>(() =>
    initialMessages.map(normalizeMessage)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const status: ChatStatus = isLoading ? 'submitted' : error ? 'error' : 'ready'

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setIsLoading(true)
      setError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      // Create user message
      const userMessage: UIMessage = {
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text: content }],
      }

      // Add user message immediately for instant feedback
      setMessages((prev) => [...prev, userMessage])

      try {
        // Convert messages to format expected by API
        // API expects UIMessage with parts array
        const apiMessages = [...messages, userMessage].map(normalizeMessage).map(msg => ({
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
            sessionId,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to process message`)
        }

        const data: BlockingChatResponse = await response.json()

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
    [api, agentId, sessionId, messages, isLoading, onError, onFinish]
  )

  // Append message (compatible with useChat API)
  const append = useCallback(
    async (message: { role: 'user' | 'assistant'; content: string }) => {
      if (message.role === 'user') {
        await sendMessage(message.content)
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
    // Find last user message
    const lastUserMessageIndex = messages.findLastIndex((m) => m.role === 'user')
    if (lastUserMessageIndex === -1) return

    // Get the text from last user message
    const lastUserMessage = messages[lastUserMessageIndex]
    const textPart = lastUserMessage.parts?.find(
      (p): p is { type: 'text'; text: string } => 'type' in p && p.type === 'text' && 'text' in p
    )

    if (!textPart) return

    // Remove messages after the last user message (including any assistant response)
    setMessages((prev) => prev.slice(0, lastUserMessageIndex))

    // Re-send the message
    await sendMessage(textPart.text)
  }, [messages, sendMessage])

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
    sendMessage,
    append,
    reload,
    stop,
  }
}
