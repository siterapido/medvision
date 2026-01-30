'use client'

/**
 * Messages - Vercel Chat SDK Pattern
 * 
 * Container de mensagens com scroll automático e botão de scroll to bottom.
 */

import type { UIMessage } from 'ai'
import { useRef, useEffect, useState, useCallback } from 'react'
import { ArrowDown } from 'lucide-react'
import { Message, ThinkingMessage } from './message'
import { Greeting } from './greeting'
import { cn } from '@/lib/utils'

interface MessagesProps {
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error' // streaming kept for compatibility
  userName?: string
  onEditMessage?: (id: string, content: string) => void
  onRegenerate?: () => void
  agentId?: string
}

export function Messages({
  messages,
  status,
  userName,
  onEditMessage,
  onRegenerate,
  agentId = 'odonto-gpt',
}: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior })
  }, [])

  // Check if user is at bottom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const threshold = 100
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold
      setIsAtBottom(isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('instant')
    }
  }, [messages, isAtBottom, scrollToBottom])

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={containerRef}
      >
        <div className={cn("mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 py-8 md:px-8", messages.length === 0 && "h-full justify-center")}>
          {messages.length === 0 && (
            <Greeting userName={userName} />
          )}


          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={status === 'streaming' && messages.length - 1 === index}
            />
          ))}

          {status === 'submitted' && <ThinkingMessage />}

          {/* Extra space for input + dock on mobile */}
          <div className="min-h-32 sm:min-h-12 shrink-0" ref={endRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${isAtBottom
            ? 'pointer-events-none scale-0 opacity-0'
            : 'pointer-events-auto scale-100 opacity-100'
          }`}
        onClick={() => scrollToBottom('smooth')}
        type="button"
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  )
}
