'use client'

/**
 * Chat - Vercel Chat SDK Pattern
 * 
 * Componente principal de chat seguindo o padrão oficial da Vercel.
 * Usa useChat do @ai-sdk/react com DefaultChatTransport.
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBlockingChat } from '@/lib/hooks/use-blocking-chat'
import { useHistoryRevalidation } from '@/lib/chat'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { ToolApprovalDialog } from './tool-approval-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

import { useChat } from '@ai-sdk/react'


interface ChatProps {
  id?: string
  initialMessages?: any[]
  apiEndpoint?: string
  agentId?: string
  userName?: string
  userImage?: string
  subscriptionInfo?: { isPro: boolean; trialDaysRemaining: number }
}

export function Chat({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId: initialAgentId = 'odonto-gpt',
  userName,
  userImage,
  subscriptionInfo,
}: ChatProps) {
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId)
  const { revalidateHistory } = useHistoryRevalidation()
  const { toggleSidebar } = useSidebar()
  const router = useRouter()

  const { messages, append, status, stop, reload } = useChat({
    id,
    initialMessages: initialMessages as any,
    api: apiEndpoint,
    body: { chatId: id },
  } as any) as any

  const componentStatus = status

  const sendMessage = (message: any) => {
    append(message)
  }

  const handleEditMessage = (id: string, content: string) => {
    // Placeholder
  }

  const handleRegenerate = () => {
    reload()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleSubmit = () => {
    if (!input.trim() || status !== 'ready') return

    append({
      role: 'user',
      content: input,
    })

    setInput('')
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col bg-background">
      {/* Header with profile and actions */}
      <div className="absolute top-0 w-full z-10 flex shrink-0 items-center justify-between px-4 py-3 bg-transparent backdrop-blur-sm">
        {/* Left: User Profile */}
        <div className="flex items-center gap-3 md:hidden">
          <Avatar className="h-8 w-8 transition-transform hover:scale-105">
            <AvatarImage src={userImage} alt={userName || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/historico')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
          >
            <History className="h-4 w-4" />
            <span className="sr-only">Histórico</span>
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col pt-14">
        <Messages
          messages={messages as any}
          status={componentStatus}
          userName={userName}
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
          agentId={selectedAgent}
        />
      </div>



      {/* Input container - mobile-first with space for dock */}
      <div
        className={cn(
          'shrink-0 px-3 pt-2',
          // Mobile: espaço para dock abaixo
          'pb-[calc(12px+64px+env(safe-area-inset-bottom))]',
          // Desktop: padding normal
          'sm:pb-6 sm:px-4'
        )}
      >
        <div className="mx-auto max-w-3xl">
          <MultimodalInput
            input={input}
            setInput={setInput}
            status={componentStatus}
            stop={stop}
            onSubmit={handleSubmit}
            showSuggestions={messages.length === 0}
            onSuggestionClick={handleSuggestionClick}
            subscriptionInfo={subscriptionInfo}
          />
        </div>
      </div>
    </div>
  )
}
