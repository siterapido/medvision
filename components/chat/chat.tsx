'use client'

/**
 * Chat - Streaming Pattern with useChat Hook
 *
 * Componente principal de chat usando AI SDK v6 useChat hook.
 * Suporta streaming, tool approval, e artifacts.
 */

import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { ToolApprovalDialog } from './tool-approval-dialog'

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
}

export function Chat({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId: initialAgentId = 'odonto-gpt',
  userName,
}: ChatProps) {
  const [chatId] = useState(() => id || crypto.randomUUID())
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId)

  // Create transport with session management
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        body: {
          agentId: selectedAgent,
          sessionId: id,
        },
      }),
    [apiEndpoint, selectedAgent, id]
  )

  // useChat hook with streaming support
  const {
    messages,
    status,
    sendMessage,
    addToolApprovalResponse,
    stop,
    reload,
    error,
  } = useChat({
    id: chatId,
    transport,
    initialMessages: initialMessages as any,

    // Auto-send when tool calls are complete
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Handle errors
    onError: (err) => {
      console.error('[Chat] Error:', err)
      toast.error('Erro no chat', {
        description: err.message || 'Erro desconhecido',
      })
    },

    // Handle finish
    onFinish: (message) => {
      console.log('[Chat] Message complete:', message.id)
    },
  })

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
            input: 'input' in part ? part.input : undefined,
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
      if ((!input.trim() && !attachments?.length) || status !== 'ready') return

      // TODO: Handle file attachments upload
      if (attachments?.length) {
        console.log('[Chat] Attachments:', attachments)
        toast.info('Upload de arquivos em desenvolvimento')
      }

      // Send message with proper UIMessage format
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
      } as any)
      setInput('')
    },
    [input, status, sendMessage]
  )

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (status !== 'ready') return

      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: suggestion }],
      } as any)
    },
    [status, sendMessage]
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

  // Map status to component status
  const componentStatus = useMemo(() => {
    switch (status) {
      case 'submitted':
        return 'submitted'
      case 'streaming':
        return 'streaming'
      case 'ready':
        return 'ready'
      default:
        return error ? 'error' : 'ready'
    }
  }, [status, error])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <Messages
        messages={messages as any}
        status={componentStatus}
        userName={userName}
        onSuggestionClick={handleSuggestionClick}
        onEditMessage={handleEditMessage}
        onRegenerate={handleRegenerate}
      />

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
      <div className="shrink-0 border-t bg-background px-2 pb-[env(safe-area-inset-bottom,8px)] pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <div className="mx-auto w-full max-w-4xl">
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
