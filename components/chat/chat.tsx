'use client'

/**
 * Chat - Blocking UI Pattern with useBlockingChat Hook
 *
 * Componente principal de chat usando blocking (non-streaming) responses.
 * Respostas completas de uma vez, sem streaming progressivo.
 * Mobile: Header flutuante estilo Perplexity
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useBlockingChat } from '@/lib/hooks/use-blocking-chat'
import { useHistoryRevalidation } from '@/lib/chat'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { ToolApprovalDialog } from './tool-approval-dialog'
import { ThemeToggleCompact } from './theme-toggle-compact'

interface ChatProps {
  id?: string
  initialMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    parts: Array<{ type: string; text?: string;[key: string]: any }>
  }>
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
  const router = useRouter()
  const [chatId] = useState(() => id || crypto.randomUUID())
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId)
  const { revalidateHistory } = useHistoryRevalidation()

  // Callback when a new session is created
  const handleSessionCreated = useCallback((newSessionId: string) => {
    console.log('[Chat] New session created:', newSessionId)
    // Revalidate sidebar to show the new chat
    revalidateHistory()
    // Update URL to include the new session ID (without full page reload)
    if (!id) {
      router.replace(`/dashboard/chat?id=${newSessionId}`, { scroll: false })
    }
  }, [id, revalidateHistory, router])

  // useBlockingChat hook - blocking (non-streaming) responses
  const {
    messages,
    setMessages,
    stop,
    reload,
    error,
    sendMessage,
    status,
    isLoading,
    sessionId,
  } = useBlockingChat({
    api: apiEndpoint,
    initialMessages: initialMessages as any,
    agentId: selectedAgent,
    sessionId: id,
    onError: (err) => {
      console.error('[Chat] Error:', err)
      toast.error('Erro no chat', {
        description: err.message || 'Erro desconhecido',
      })
    },
    onSessionCreated: handleSessionCreated,
  })

  // Tool approval handler (simplified for blocking UI)
  const addToolApprovalResponse = useCallback(
    (_response: { id: string; approved: boolean }) => {
      // Tool approval is handled server-side with maxSteps in blocking mode
      toast.info('Tool approval handled automatically')
    },
    []
  )

  // Handle sending messages via useBlockingChat
  const handleManualSubmit = useCallback(
    (textInput: string, attachments?: File[]) => {
      if ((!textInput.trim() && !attachments?.length) || isLoading) return

      setInput('')

      // Use sendMessage to send the message with attachments through the blocking chat hook
      sendMessage(textInput, attachments)
    },
    [isLoading, sendMessage, setInput]
  )

  // Find pending tool approvals
  const pendingApproval = useMemo(() => {
    for (const message of messages.slice().reverse()) {
      if (message.role !== 'assistant' || !message.parts) continue

      for (const part of message.parts) {
        if (
          typeof part === 'object' &&
          'type' in part &&
          typeof part.type === 'string' &&
          part.type.startsWith('tool-') &&
          'state' in part &&
          part.state === 'approval-requested' &&
          'approval' in part &&
          part.approval
        ) {
          return {
            toolName: part.type.replace('tool-', ''),
            input: 'input' in part ? (part.input as Record<string, unknown>) : undefined,
            approvalId: part.approval.id,
          }
        }
      }
    }
    return null
  }, [messages])

  // Handle submit with optional attachments (images, files)
  const handleSubmit = useCallback(
    (attachments?: File[]) => {
      // Pass input and attachments to handleManualSubmit
      handleManualSubmit(input, attachments)
    },
    [input, handleManualSubmit]
  )

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isLoading) return
      handleManualSubmit(suggestion)
    },
    [isLoading, handleManualSubmit]
  )

  // Handle edit message
  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message && message.role === 'user') {
        const textContent = message.parts
          ?.filter(
            (p): p is { type: 'text'; text: string } =>
              typeof p === 'object' && p.type === 'text' && 'text' in p
          )
          .map((p) => p.text)
          .join('\n')

        if (textContent) {
          setInput(textContent)
          toast.info('Editando mensagem')
        }
      }
    },
    [messages]
  )

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    reload()
    toast.info('Regenerando resposta...')
  }, [reload])

  // Handle tool approval
  const handleApprove = useCallback(() => {
    if (pendingApproval) {
      addToolApprovalResponse({
        id: pendingApproval.approvalId,
        approved: true,
      })
      toast.success('Acao aprovada')
    }
  }, [pendingApproval, addToolApprovalResponse])

  // Handle tool rejection
  const handleReject = useCallback(() => {
    if (pendingApproval) {
      addToolApprovalResponse({
        id: pendingApproval.approvalId,
        approved: false,
      })
      toast.info('Acao cancelada')
    }
  }, [pendingApproval, addToolApprovalResponse])

  // Map status to component status (blocking UI - no streaming state)
  const componentStatus = useMemo(() => {
    if (isLoading) return 'submitted'
    if (error) return 'error'
    return status === 'ready' ? 'ready' : 'submitted'
  }, [status, error, isLoading])

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col bg-background">
      {/* Header with theme toggle */}
      <div className="absolute top-0 right-0 z-10 flex items-center justify-end px-4 py-3">
        <ThemeToggleCompact />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Messages
          messages={messages as any}
          status={componentStatus}
          userName={userName}
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
          agentId={selectedAgent}
        />
      </div>

      {/* Tool Approval Dialog */}
      {pendingApproval && (
        <ToolApprovalDialog
          toolName={pendingApproval.toolName}
          input={pendingApproval.input}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

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
