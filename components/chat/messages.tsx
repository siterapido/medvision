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
import { useMessageBlocks } from '@/lib/hooks/use-message-blocks'

interface MessagesProps {
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error' // streaming kept for compatibility
  userName?: string
  onEditMessage?: (messageId: string) => void
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

  // Use message blocks for better organization
  const { state: blockState } = useMessageBlocks(messages)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    try {
      endRef.current?.scrollIntoView({ behavior })
    } catch (e) {
      // Ignorar erros de DOM que ocorrem durante atualizacoes de estado
      // Ex: "Node cannot be found in the current page"
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Messages] Scroll error (ignorado):', e)
      }
    }
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
      {/* Decorative gradient background - only shown when empty */}
      {messages.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#00A3FF]/5 via-[#00D4FF]/3 to-transparent" />
          {/* Wave decoration */}
          <svg
            className="absolute bottom-0 left-0 w-full h-auto text-background"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
          </svg>
        </div>
      )}
      <div
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        ref={containerRef}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={cn("mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 py-8 md:px-8", messages.length === 0 && "h-full justify-center")}>
          {messages.length === 0 && (
            <Greeting userName={userName} />
          )}

          {/* Debug info - remove in production */}
          {messages.length > 0 && process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground/50 px-2">
              {blockState.hasArtifacts && '📄 '}
              {blockState.hasPendingTools && '⏳ '}
              Blocos: {blockState.blocksByMessageId.size}
            </div>
          )}

          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={status === 'streaming' && messages.length - 1 === index}
              onEdit={onEditMessage}
              onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
              agentId={agentId}
            />
          ))}

          {status === 'submitted' && <ThinkingMessage agentId={agentId} />}

          {/* Extra space for input + dock on mobile */}
          <div className="min-h-32 sm:min-h-12 shrink-0" ref={endRef} />
        </div>
      </div>

      {/* Scroll to bottom button - positioned for mobile visibility */}
      <button
        aria-label="Scroll to bottom"
        className={cn(
          'absolute bottom-3 left-1/2 z-20 -translate-x-1/2',
          'rounded-full border bg-card p-2 backdrop-blur-sm',
          // Use system.md border tokens
          'border-[var(--border)]',
          'transition-all active:scale-95 sm:bottom-4',
          isAtBottom
            ? 'pointer-events-none scale-0 opacity-0'
            : 'pointer-events-auto scale-100 opacity-100'
        )}
        onClick={() => scrollToBottom('smooth')}
        type="button"
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  )
}
