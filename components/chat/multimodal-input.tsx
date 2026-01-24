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
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, StopIcon, MicIcon, PaperclipIcon } from './icons'
import { AgentSwitcher, getAgentPill, AGENT_PILLS } from './agent-switcher'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { X, ImageIcon, FileIcon } from 'lucide-react'

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

  const isLoading = status === 'submitted' || status === 'streaming'
  const agentConfig = getAgentPill(selectedAgent)

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
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (!isMobile) {
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

      {/* Main container - Perplexity style */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-2xl border border-border bg-card p-4 shadow-sm',
          'transition-all duration-200',
          'focus-within:border-primary/50 focus-within:shadow-md',
          'hover:border-muted-foreground/30',
          isDragging && 'border-primary border-dashed bg-primary/5'
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

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={agentConfig.placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            'min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent p-0',
            'text-base text-foreground placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
          )}
        />

        {/* Footer: Agent Switcher + Actions */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {/* Left: Agent Switcher */}
          <AgentSwitcher
            agents={AGENT_PILLS}
            selectedAgent={selectedAgent}
            onAgentChange={handleAgentChange}
            disabled={isLoading}
          />

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Attach button */}
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

            {/* Submit/Stop button */}
            {isLoading ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={stop}
                className="size-9 rounded-full border-muted-foreground/30 bg-muted text-foreground hover:bg-muted/80"
                title="Parar geracao"
              >
                <StopIcon size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() && attachments.length === 0}
                className="size-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                title="Enviar mensagem"
              >
                <ArrowUpIcon size={16} />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
