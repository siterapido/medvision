'use client'

/**
 * Multimodal Input - Perplexity-style Design
 *
 * Campo de input inspirado na UI da Perplexity com:
 * - Input centralizado e expansivo
 * - Borda arredondada suave (radius ~16px)
 * - Background claro com borda sutil
 * - Badge Pro/Trial (esquerda) - mostra status da assinatura
 * - Botoes de acao organizados (direita)
 * - Texto escuro no tema claro (#0f172a)
 * - Suporte a drag-drop e paste de imagens
 * - Reconhecimento de voz
 * - Mobile: Bottom sheets para anexos
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, StopIcon, MicIcon, PaperclipIcon } from './icons'
import { MobileSourcesSheet } from '@/components/mobile/mobile-sources-sheet'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { X, ImageIcon, FileIcon, Plus, Crown, Clock } from 'lucide-react'

interface Attachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document'
}

// Suggestion chips for empty state
const SUGGESTIONS = [
  'Anatomia do 1º molar',
  'Preparo classe I',
  'Protocolo anestesia',
  'Endodontia',
]

interface MultimodalInputProps {
  input: string
  setInput: (value: string) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  stop: () => void
  onSubmit: (attachments?: File[]) => void
  className?: string
  // Subscription info
  subscriptionInfo?: { isPro: boolean; trialDaysRemaining: number }
  // Suggestions
  showSuggestions?: boolean
  onSuggestionClick?: (suggestion: string) => void
}

export function MultimodalInput({
  input,
  setInput,
  status,
  stop,
  onSubmit,
  className,
  subscriptionInfo,
  showSuggestions = false,
  onSuggestionClick,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Mobile state
  const isMobile = useIsMobile()
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false)

  const isLoading = status === 'submitted' || status === 'streaming'
  const isPro = subscriptionInfo?.isPro ?? false
  const trialDaysRemaining = subscriptionInfo?.trialDaysRemaining ?? 0

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

      {/* Mobile Sheet for sources */}
      {isMobile && (
        <MobileSourcesSheet
          open={sourcesSheetOpen}
          onOpenChange={setSourcesSheetOpen}
          onFilesSelected={handleFiles}
        />
      )}

      {/* Main container - Input Glow Signature */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col gap-1 p-2 transition-all duration-300',
          'rounded-[28px] overflow-hidden',

          // Light Mode - Transparent Gradient
          'bg-gradient-to-b from-slate-50/60 to-slate-50/20 border border-cyan-500/20 backdrop-blur-xl',
          'shadow-[0_4px_20px_-4px_rgba(6,182,212,0.1)]',
          'hover:from-slate-50/80 hover:to-slate-50/40 hover:border-cyan-500/40 hover:shadow-[0_4px_24px_-4px_rgba(6,182,212,0.2)]',
          'focus-within:from-slate-50/90 focus-within:to-slate-50/50 focus-within:border-cyan-500/50',

          // Dark Mode - Deep Blue Transparent Gradient (More Glass)
          'dark:bg-gradient-to-b dark:from-[#020617]/60 dark:to-[#020617]/30 dark:border-white/[0.08] dark:backdrop-blur-xl',
          'dark:shadow-[0_4px_30px_-4px_rgba(6,182,212,0.15)]',
          'dark:hover:from-[#020617]/80 dark:hover:to-[#020617]/50 dark:hover:border-white/[0.15] dark:hover:shadow-[0_4px_40px_-4px_rgba(6,182,212,0.25)]',
          'dark:focus-within:from-[#020617]/90 dark:focus-within:to-[#020617]/70 dark:focus-within:border-cyan-500/40',

          // Drag state
          isDragging && 'border-cyan-500/50 bg-cyan-500/5'
        )}
      >
        {/* Internal Blue Glow - Enhanced for Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-cyan-500/[0.02] pointer-events-none" />
        {/* Drag overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-primary/10 dark:bg-white/[0.08] backdrop-blur-sm">
            <p className="text-sm font-medium text-primary dark:text-slate-200">
              Solte os arquivos aqui
            </p>
          </div>
        )}

        {/* Suggestion chips - shown when input is empty */}
        {!input.trim() && showSuggestions && onSuggestionClick && (
          <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full',
                  'text-xs font-medium',
                  'bg-white/5 dark:bg-white/[0.06]',
                  'text-muted-foreground',
                  'border border-transparent',
                  'hover:border-cyan-500/30 hover:text-foreground',
                  'transition-all duration-150',
                  'active:scale-95'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 px-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-3 py-2"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : attachment.type === 'image' ? (
                  <ImageIcon className="h-4 w-4 text-zinc-400 dark:text-slate-400" />
                ) : (
                  <FileIcon className="h-4 w-4 text-zinc-400 dark:text-slate-400" />
                )}
                <span className="max-w-[120px] truncate text-xs text-zinc-700 dark:text-slate-200">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea - Glass-friendly text colors */}
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
              'text-sm text-zinc-900 dark:text-slate-100',
              'outline-none placeholder:text-zinc-400 dark:placeholder:text-slate-400',
              'max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed font-sans',
              'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
            )}
          />
        </div>

        {/* Footer: Subscription Badge + Actions */}
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          {/* Left side: Subscription Badge */}
          <div className="flex items-center gap-1.5">
            {/* Plus button - opens sources sheet (mobile only) */}
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSourcesSheetOpen(true)}
                disabled={isLoading}
                className="size-9 rounded-lg text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-600 dark:hover:text-slate-200"
                aria-label="Anexar arquivo"
              >
                <Plus className="size-5" />
              </Button>
            )}

            {/* Subscription Badge - Minimalista */}
            {isPro ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-primary/30 bg-primary/10">
                <Crown className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Pro</span>
              </div>
            ) : trialDaysRemaining > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-primary/30 bg-primary/10">
                <Clock className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {trialDaysRemaining}d
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Expirado
                </span>
              </div>
            )}
          </div>

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
                className="size-9 rounded-lg text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-600 dark:hover:text-slate-200"
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
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-zinc-400 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-600 dark:hover:text-slate-200'
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
                  'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-slate-300',
                  'transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-white/15'
                )}
                title="Parar geracao"
              >
                <div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-600 dark:border-t-cyan-400 rounded-full animate-spin" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className={cn(
                  'flex items-center justify-center shrink-0 h-8 w-8 rounded-xl transition-all duration-300',
                  (input.trim() || attachments.length > 0)
                    ? 'bg-cyan-500 text-white hover:bg-cyan-400 active:scale-95 shadow-md shadow-cyan-500/30'
                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-slate-500 cursor-not-allowed'
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
