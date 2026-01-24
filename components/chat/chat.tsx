'use client'

/**
 * Chat - Block Response Pattern (Non-Streaming)
 *
 * Componente principal de chat usando respostas em bloco.
 * Usa fetch direto para a API com resposta JSON completa.
 */

import { UIMessage } from 'ai'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'

interface ChatProps {
  id?: string
  initialMessages?: UIMessage[]
  apiEndpoint?: string
  agentId?: string
  userName?: string
}

export function Chat({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId = 'odonto-gpt',
  userName,
}: ChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming' | 'error'>('ready')
  const [chatId] = useState(() => id || crypto.randomUUID())
  const [sessionId, setSessionId] = useState<string | undefined>(id)

  // Send message to API and get response
  const sendMessage = useCallback(
    async (userMessage: { role: 'user'; parts: Array<{ type: 'text'; text: string }> }) => {
      const newUserMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        parts: userMessage.parts,
      }

      // Add user message to state
      setMessages((prev) => [...prev, newUserMessage])
      setStatus('submitted')

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newUserMessage,
            agentId,
            sessionId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // Update session ID if returned
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId)
        }

        // Add assistant message to state
        if (data.message) {
          setMessages((prev) => [...prev, data.message])
        }

        setStatus('ready')
        console.log('[Chat] Message complete:', data.message?.id)
      } catch (error) {
        console.error('[Chat] Error:', error)
        setStatus('error')
        toast.error('Erro no chat', {
          description: error instanceof Error ? error.message : 'Erro desconhecido',
        })
        // Reset to ready after error
        setTimeout(() => setStatus('ready'), 1000)
      }
    },
    [apiEndpoint, agentId, sessionId]
  )

  const handleSubmit = useCallback(
    (attachments?: File[]) => {
      if ((!input.trim() && !attachments?.length) || status !== 'ready') return

      // TODO: Handle file attachments upload
      if (attachments?.length) {
        console.log('[Chat] Attachments:', attachments)
        toast.info('Upload de arquivos em desenvolvimento')
      }

      // Send message with proper UIMessage format (role + parts)
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
      })
      setInput('')
    },
    [input, status, sendMessage]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (status !== 'ready') return

      // Send message immediately with proper UIMessage format
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: suggestion }],
      })
    },
    [status, sendMessage]
  )

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message && message.role === 'user') {
        const textContent = message.parts
          ?.filter(
            (p): p is { type: 'text'; text: string } =>
              p.type === 'text' && 'text' in p
          )
          .map((p) => p.text)
          .join('\n')

        if (textContent) {
          setInput(textContent)
          // Remove messages from edited one onwards
          const messageIndex = messages.findIndex((m) => m.id === messageId)
          if (messageIndex >= 0) {
            setMessages(messages.slice(0, messageIndex))
          }
          toast.info('Editando mensagem')
        }
      }
    },
    [messages]
  )

  const handleRegenerate = useCallback(() => {
    // Remove last assistant message and resend the last user message
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user')
    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[lastUserMessageIndex]
      const textContent = lastUserMessage.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
        .map((p) => p.text)
        .join('\n')

      if (textContent) {
        // Remove all messages after the last user message
        setMessages(messages.slice(0, lastUserMessageIndex))
        // Resend the message
        setTimeout(() => {
          sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: textContent }],
          })
        }, 100)
        toast.info('Regenerando resposta...')
      }
    }
  }, [messages, sendMessage])

  // Stop function (no-op for non-streaming)
  const stop = useCallback(() => {
    // No-op for non-streaming
  }, [])

  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <Messages
        messages={messages}
        status={status}
        userName={userName}
        onSuggestionClick={handleSuggestionClick}
        onEditMessage={handleEditMessage}
        onRegenerate={handleRegenerate}
      />

      <div className="mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
        <MultimodalInput
          input={input}
          setInput={setInput}
          status={status}
          stop={stop}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
