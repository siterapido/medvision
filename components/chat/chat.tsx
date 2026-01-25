'use client'

/**
 * Chat - Blocking UI Pattern with useBlockingChat Hook
 *
 * Componente principal de chat usando blocking (non-streaming) responses.
 * Respostas completas de uma vez, sem streaming progressivo.
 * Mobile: Header flutuante estilo Perplexity
 */

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useBlockingChat } from '@/lib/hooks/use-blocking-chat'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { ToolApprovalDialog } from './tool-approval-dialog'
import { MobileFloatingHeader } from '@/components/mobile/mobile-floating-header'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface ChatProps {
  id?: string
  initialMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    parts: Array<{ type: string; text?: string; [key: string]: any }>
  }>
  apiEndpoint?: string
  agentId?: string
  userName?: string
  userImage?: string
}

export function Chat({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId: initialAgentId = 'odonto-gpt',
  userName,
  userImage,
}: ChatProps) {
  const [chatId] = useState(() => id || crypto.randomUUID())
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId)
  const isMobile = useIsMobile()

  // useBlockingChat hook - blocking (non-streaming) responses
  const {
    messages,
    setMessages,
    stop,
    reload,
    error,
    append,
    status,
    isLoading,
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
    (textInput: string) => {
      if (!textInput.trim() || isLoading) return

      setInput('')

      // Use append to send the message through the blocking chat hook
      append({
        role: 'user',
        content: textInput,
      })
    },
    [isLoading, append, setInput]
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

  // Handle submit
  const handleSubmit = useCallback(
    (attachments?: File[]) => {
      // Pass manual handler
      handleManualSubmit(input)
      
      // TODO: Handle file attachments upload
      if (attachments?.length) {
        console.log('[Chat] Attachments:', attachments)
        toast.info('Upload de arquivos em desenvolvimento')
      }
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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      {/* Mobile Floating Header */}
      {isMobile && (
        <MobileFloatingHeader
          userName={userName}
          userImage={userImage}
        />
      )}

      {/* Messages area - add top padding on mobile for header */}
      <div className={cn("flex-1 overflow-hidden flex flex-col", isMobile ? 'pt-[52px]' : '')}>
        <Messages
          messages={messages as any}
          status={componentStatus}
          userName={userName}
          onSuggestionClick={handleSuggestionClick}
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
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

      {/* Input container - mobile-first with safe area for iOS */}
      <div className="shrink-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 pb-[env(safe-area-inset-bottom,20px)] pt-2 sm:px-4 sm:pb-6 sm:pt-4">
        <div className="mx-auto w-full max-w-3xl">
          <MultimodalInput
            input={input}
            setInput={setInput}
            status={componentStatus}
            stop={stop}
            onSubmit={handleSubmit}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
        </div>
      </div>
    </div>
  )
}
