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

interface MessagesProps {
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  userName?: string
  onSuggestionClick?: (suggestion: string) => void
  onEditMessage?: (messageId: string) => void
  onRegenerate?: () => void
}

export function Messages({
  messages,
  status,
  userName,
  onSuggestionClick,
  onEditMessage,
  onRegenerate,
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
    <div className="relative min-h-0 flex-1">
      <div
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        ref={containerRef}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:gap-6">
          {messages.length === 0 && (
            <Greeting userName={userName} onSuggestionClick={onSuggestionClick} />
          )}

          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={status === 'streaming' && messages.length - 1 === index}
              onEdit={onEditMessage}
              onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
            />
          ))}

          {status === 'submitted' && <ThinkingMessage />}

          <div className="min-h-6 shrink-0" ref={endRef} />
        </div>
      </div>

      {/* Scroll to bottom button - positioned for mobile visibility */}
      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border bg-background/95 p-2 shadow-lg backdrop-blur-sm transition-all active:scale-95 sm:bottom-4 ${
          isAtBottom
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
