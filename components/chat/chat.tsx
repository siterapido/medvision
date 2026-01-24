'use client'

/**
 * Chat - Vercel Chat SDK Pattern
 *
 * Componente principal de chat seguindo o padrao oficial da Vercel.
 * Usa useChat do @ai-sdk/react com DefaultChatTransport.
 */

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { useState, useCallback, useMemo } from 'react'
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
  const [chatId] = useState(() => id || crypto.randomUUID())

  // Memoize transport to avoid recreation on every render
  // Following vercel/ai-chatbot pattern: send only last message for normal requests
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        prepareSendMessagesRequest: ({ id: reqId, messages: msgs }) => {
          const lastMessage = msgs.at(-1)

          // Check if this is a tool approval continuation
          const isToolApprovalContinuation =
            lastMessage?.role !== 'user' ||
            msgs.some((msg) =>
              msg.parts?.some((part: any) => {
                const state = part.state
                return state === 'approval-responded' || state === 'output-denied'
              })
            )

          return {
            body: {
              id: reqId,
              // For tool approvals: send all messages
              // For normal messages: send only the last message
              ...(isToolApprovalContinuation
                ? { messages: msgs }
                : { message: lastMessage }),
              agentId,
              sessionId: chatId,
            },
          }
        },
      }),
    [apiEndpoint, agentId, chatId]
  )

  const { messages, sendMessage, status, stop, reload, setMessages } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onError: (error) => {
      console.error('[Chat] Error:', error)
      toast.error('Erro no chat', { description: error.message })
    },
    onFinish: (message) => {
      console.log('[Chat] Message complete:', message?.id)
    },
  })

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
    [messages, setMessages]
  )

  const handleRegenerate = useCallback(() => {
    reload()
    toast.info('Regenerando resposta...')
  }, [reload])

  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <Messages
        messages={messages}
        status={status}
        userName={userName}
        onSuggestionClick={handleSuggestionClick}
        onEditMessage={handleEditMessage}
        onRegenerate={handleRegenerate}
      />

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
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
