'use client'

/**
 * Multimodal Input - Vercel Chat SDK Pattern
 *
 * Campo de input estilizado seguindo o padrao oficial.
 * - Borda arredondada com sombra sutil
 * - Botao de envio circular com fundo primary
 * - Suporte a Shift+Enter para nova linha
 * - Drag-drop de arquivos
 * - Paste de imagens do clipboard
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, StopIcon, MicIcon, PaperclipIcon } from './icons'
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
}

export function MultimodalInput({
  input,
  setInput,
  status,
  stop,
  onSubmit,
  className,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

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

  const isLoading = status === 'submitted' || status === 'streaming'

  return (
    <div className={cn('relative flex w-full flex-col gap-4', className)}>
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

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
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
              <span className="max-w-[120px] truncate text-xs">
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

      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-ring hover:border-muted-foreground/50',
          isDragging && 'border-primary border-dashed bg-primary/5'
        )}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-primary/5">
            <p className="text-sm text-primary">Solte os arquivos aqui</p>
          </div>
        )}

        <div className="flex flex-row items-start gap-1 sm:gap-2">
          {/* Attach button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="size-8 shrink-0 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground mt-1"
            title="Anexar arquivo"
          >
            <PaperclipIcon size={16} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleVoiceInput}
            className={cn(
              'size-8 shrink-0 rounded-lg transition-all duration-200 mt-1',
              isListening
                ? 'bg-red-500/10 text-red-500 animate-pulse'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            title={isListening ? 'Parar' : 'Voz'}
          >
            <MicIcon size={16} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Envie uma mensagem..."
            disabled={isLoading}
            rows={1}
            className="grow resize-none border-0 border-none bg-transparent p-2 text-base outline-none ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[200px]"
          />
        </div>

        <div className="flex justify-end pt-2">
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stop}
              className="size-8 rounded-full bg-foreground text-background transition-colors duration-200 hover:bg-foreground/90"
            >
              <StopIcon size={14} />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() && attachments.length === 0}
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              <ArrowUpIcon size={14} />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
