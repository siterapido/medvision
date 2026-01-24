'use client'

/**
 * Chat - Vercel Chat SDK Pattern
 * 
 * Componente principal de chat seguindo o padrão oficial da Vercel.
 * Usa useChat do @ai-sdk/react com DefaultChatTransport.
 */

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { useState } from 'react'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'

interface ChatProps {
  id?: string
  initialMessages?: UIMessage[]
  apiEndpoint?: string
}

export function Chat({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
}: ChatProps) {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, stop } = useChat<UIMessage>({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body: { chatId: id },
    }),
  })

  const handleSubmit = () => {
    if (!input.trim() || status !== 'ready') return

    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input }],
    })

    setInput('')
  }

  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <Messages messages={messages} status={status} />

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
