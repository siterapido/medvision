'use client'

/**
 * Chat - Vercel Chat SDK Pattern (AI SDK v6)
 *
 * Componente principal de chat seguindo o padrão oficial da Vercel.
 * Usa useChat do @ai-sdk/react com DefaultChatTransport.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DefaultChatTransport } from 'ai'
import { History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { AgentSwitcher, AGENT_PILLS, getAgentPill } from './agent-switcher'
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
  const { toggleSidebar } = useSidebar()
  const router = useRouter()

  // Ref para agentId evita recriar o transport a cada troca de agente
  const agentRef = useRef(selectedAgent)
  useEffect(() => { agentRef.current = selectedAgent }, [selectedAgent])

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: apiEndpoint,
      body: () => ({ sessionId: id, agentId: agentRef.current }),
    }),
    [apiEndpoint, id]
  )

  const useChatOptions = useMemo(() => {
    const opts: Record<string, unknown> = {
      messages: initialMessages,
      transport,
    }
    if (id !== undefined) {
      opts.id = id
    }
    return opts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, transport])

  const { messages, sendMessage, status, stop, regenerate, error } = useChat(useChatOptions as any)

  const handleEditMessage = (_id: string, _content: string) => {
    // TODO: implement edit
  }

  const handleRegenerate = () => {
    regenerate()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId)
    // Atualiza placeholder do input via agentPill
    const pill = getAgentPill(agentId)
    // Focus no input ao trocar agente
    setTimeout(() => {
      const textarea = document.querySelector('textarea')
      if (textarea) textarea.focus()
    }, 100)
  }

  const handleSubmit = async () => {
    if (!input.trim() || status === 'submitted' || status === 'streaming') return

    const text = input
    setInput('')
    sendMessage({ text })
  }

  const currentPill = getAgentPill(selectedAgent)

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col bg-background">
      {/* Header with profile and actions */}
      <div className="absolute top-0 w-full z-10 flex shrink-0 items-center justify-between px-4 py-3 bg-transparent backdrop-blur-sm">
        {/* Left: User Profile (mobile only) */}
        <div className="flex items-center gap-3 md:hidden">
          <Avatar className="h-8 w-8 transition-transform hover:scale-105">
            <AvatarImage src={userImage} alt={userName || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Center: Agent Switcher — visível em todas as telas */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <AgentSwitcher
            selectedAgent={selectedAgent}
            onAgentChange={handleAgentChange}
            disabled={status === 'submitted' || status === 'streaming'}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
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
          status={status}
          userName={userName}
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
          agentId={selectedAgent}
          error={error ?? null}
        />
      </div>

      {/* Input container */}
      <div
        className={cn(
          'shrink-0 px-3 pt-2',
          'pb-[calc(12px+64px+env(safe-area-inset-bottom))]',
          'sm:pb-6 sm:px-4'
        )}
      >
        <div className="mx-auto max-w-3xl">
          <MultimodalInput
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
            onSubmit={handleSubmit}
            showSuggestions={messages.length === 0}
            onSuggestionClick={handleSuggestionClick}
            subscriptionInfo={subscriptionInfo}
            placeholder={currentPill.placeholder}
          />
        </div>
      </div>
    </div>
  )
}
