'use client'

/**
 * Multimodal Input - Perplexity-style Design
 *
 * Campo de input inspirado na UI da Perplexity com:
 * - Input centralizado e expansivo
 * - Borda arredondada suave (radius ~16px)
 * - Background claro com borda sutil
 * - Agent Switcher integrado (esquerda)
 * - Botoes de acao organizados (direita)
 * - Texto escuro no tema claro (#0f172a)
 * - Suporte a drag-drop e paste de imagens
 * - Reconhecimento de voz
 * - Mobile: Bottom sheets para agentes e anexos
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, StopIcon, MicIcon, PaperclipIcon } from './icons'
import { AgentSwitcher, getAgentPill, AGENT_PILLS } from './agent-switcher'
import { MobileAgentSelectorSheet } from '@/components/mobile/mobile-agent-selector-sheet'
import { MobileSourcesSheet } from '@/components/mobile/mobile-sources-sheet'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { X, ImageIcon, FileIcon, Plus, ChevronDown } from 'lucide-react'
import { getAgentUI } from '@/lib/constants/agents'

interface Attachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document'
}

interface MultimodalInputProps {
  input: string
  setInput: (value: string) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  stop: () => void
  onSubmit: (attachments?: File[]) => void
  className?: string
  // Agent switching
  selectedAgent?: string
  onAgentChange?: (agentId: string) => void
}

export function MultimodalInput({
  input,
  setInput,
  status,
  stop,
  onSubmit,
  className,
  selectedAgent = 'odonto-gpt',
  onAgentChange,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Mobile state
  const isMobile = useIsMobile()
  const [agentSheetOpen, setAgentSheetOpen] = useState(false)
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false)

  const isLoading = status === 'submitted' || status === 'streaming'
  const agentConfig = getAgentPill(selectedAgent)
  const agentUIConfig = getAgentUI(selectedAgent)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  // Auto-focus on mount (skip on mobile)
  useEffect(() => {
    const checkMobile = window.matchMedia('(max-width: 640px)').matches
    if (!checkMobile) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newAttachments: Attachment[] = []

    fileArray.forEach((file) => {
      const isImage = file.type.startsWith('image/')
      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type: isImage ? 'image' : 'document',
      }

      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? { ...a, preview: e.target?.result as string }
                : a
            )
          )
        }
        reader.readAsDataURL(file)
      }

      newAttachments.push(attachment)
    })

    setAttachments((prev) => [...prev, ...newAttachments])
    toast.success(`${fileArray.length} arquivo(s) anexado(s)`)
  }, [])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  // Paste handler for images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      const files: File[] = []

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        e.preventDefault()
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  // Voice input
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Seu navegador nao suporta reconhecimento de voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.info('Ouvindo...')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento:', event.error)
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript
          setInput(input + (input ? ' ' : '') + transcript)
        }
      }
    }

    recognition.start()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if ((input.trim() || attachments.length > 0) && status === 'ready') {
        handleSubmit()
      }
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && attachments.length === 0) || status !== 'ready')
      return

    const files = attachments.map((a) => a.file)
    onSubmit(files.length > 0 ? files : undefined)
    setAttachments([])
  }

  const handleAgentChange = (agentId: string) => {
    if (onAgentChange) {
      onAgentChange(agentId)
    }
  }

  return (
    <div className={cn('relative flex w-full flex-col gap-3', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Mobile Sheets */}
      {isMobile && (
        <>
          <MobileAgentSelectorSheet
            open={agentSheetOpen}
            onOpenChange={setAgentSheetOpen}
            selectedAgent={selectedAgent}
            onAgentChange={handleAgentChange}
          />
          <MobileSourcesSheet
            open={sourcesSheetOpen}
            onOpenChange={setSourcesSheetOpen}
            onFilesSelected={handleFiles}
          />
        </>
      )}

      {/* Main container - Restored Perplexity style with more rounded corners */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col gap-1 p-2',
          // More rounded corners like commit 3816e13
          'rounded-[28px]',
          'bg-white dark:bg-zinc-900',
          // Subtle shadow and ring
          'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
          'ring-1 ring-zinc-200 dark:ring-zinc-800',
          'transition-all duration-500',
          // Focus state
          'focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700',
          'focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.1)]',
          // Drag state
          isDragging && 'ring-primary ring-dashed bg-primary/5'
        )}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/5">
            <p className="text-sm font-medium text-primary">
              Solte os arquivos aqui
            </p>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : attachment.type === 'image' ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="max-w-[120px] truncate text-xs text-foreground">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea - Restored style from 3816e13 */}
        <div className="px-4 pt-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Perguntar ao Odonto GPT..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent py-2 border-0',
              'text-sm text-zinc-900 dark:text-zinc-100',
              'outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              'max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed font-sans',
              'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
            )}
          />
        </div>

        {/* Footer: Agent Switcher + Actions - Restored style from 3816e13 */}
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          {/* Left side */}
          {isMobile ? (
            /* Mobile: Plus button + Agent pill button */
            <div className="flex items-center gap-1.5">
              {/* Plus button - opens sources sheet */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSourcesSheetOpen(true)}
                disabled={isLoading}
                className="size-9 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Anexar arquivo"
              >
                <Plus className="size-5" />
              </Button>

              {/* Agent pill - opens agent selector sheet */}
              <button
                type="button"
                onClick={() => setAgentSheetOpen(true)}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                  'border-2 transition-all',
                  agentUIConfig.borderColor,
                  agentUIConfig.bgColor,
                  'active:scale-95'
                )}
              >
                <span className="text-base">{agentUIConfig.icon}</span>
                <span className="text-sm font-medium text-foreground">
                  {agentUIConfig.shortName}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            /* Desktop: Full Agent Switcher */
            <AgentSwitcher
              agents={AGENT_PILLS}
              selectedAgent={selectedAgent}
              onAgentChange={handleAgentChange}
              disabled={isLoading}
            />
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Attach button - desktop only (mobile uses sheet) */}
            {!isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="size-9 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="Anexar arquivo"
              >
                <PaperclipIcon size={18} />
              </Button>
            )}

            {/* Voice button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={cn(
                'size-9 rounded-lg transition-all duration-200',
                isListening
                  ? 'bg-red-500/10 text-red-500 animate-pulse'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              title={isListening ? 'Parar gravacao' : 'Entrada de voz'}
            >
              <MicIcon size={18} />
            </Button>

            {/* Submit/Stop button - Restored style from 3816e13 */}
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className={cn(
                  'flex items-center justify-center shrink-0 h-8 w-8 rounded-xl',
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                  'transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
                title="Parar geracao"
              >
                <div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className={cn(
                  'flex items-center justify-center shrink-0 h-8 w-8 rounded-xl transition-all duration-300',
                  (input.trim() || attachments.length > 0)
                    ? 'bg-[#00A3FF] text-white hover:opacity-90 active:scale-95 shadow-md shadow-[#00A3FF]/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                )}
                title="Enviar mensagem"
              >
                <ArrowUpIcon size={16} className="stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
