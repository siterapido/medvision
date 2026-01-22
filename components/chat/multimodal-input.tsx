'use client'

/**
 * Multimodal Input - Vercel Chat SDK Pattern
 * 
 * Campo de input estilizado seguindo o padrão oficial.
 * - Borda arredondada com sombra sutil
 * - Botão de envio circular com fundo primary
 * - Suporte a Shift+Enter para nova linha
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, StopIcon, MicIcon } from './icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MultimodalInputProps {
  input: string
  setInput: (value: string) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  stop: () => void
  onSubmit: () => void
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

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.info("Ouvindo...")
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
      if (input.trim() && status === 'ready') {
        onSubmit()
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return
    onSubmit()
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  return (
    <div className={cn('relative flex w-full flex-col gap-4', className)}>
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-ring hover:border-muted-foreground/50"
      >
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleVoiceInput}
            className={cn(
              "size-8 shrink-0 rounded-lg transition-all duration-200 mt-1",
              isListening
                ? "bg-red-500/10 text-red-500 animate-pulse"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            title={isListening ? "Parar" : "Voz"}
          >
            <MicIcon size={16} />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
              disabled={!input.trim()}
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
