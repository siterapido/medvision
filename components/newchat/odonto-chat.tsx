'use client'

/**
 * Componente de Chat Principal
 * 
 * Interface de chat usando o Vercel AI SDK useChat hook.
 * Compatível com o Chat SDK pattern.
 */

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, StopCircle, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface OdontoChatProps {
  chatId?: string
  initialMessages?: UIMessage[]
  className?: string
}

export function OdontoChat({ chatId, initialMessages, className }: OdontoChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId },
    }),
  })

  // Auto-scroll para novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input })
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

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
      alert('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false // Usar apenas resultados finais para evitar complexidade de cursor

    recognition.onstart = () => {
      setIsListening(true)
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
          setInput((prev) => prev + (prev ? ' ' : '') + transcript)

          // Ajusta altura do textarea
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
          }
        }
      }
    }

    recognition.start()
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Olá! Sou o MedVision 🦷</p>
              <p className="text-sm">Como posso te ajudar nos estudos hoje?</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-4',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {message.parts.map((part, index) => {
                // Texto normal
                if (part.type === 'text') {
                  return (
                    <div key={index} className="prose dark:prose-invert prose-sm max-w-none">
                      {part.text}
                    </div>
                  )
                }

                // Ferramentas de pesquisa
                if (part.type === 'tool-askPerplexity' || part.type === 'tool-searchPubMed') {
                  if (part.state === 'input-available') {
                    return (
                      <div key={index} className="flex items-center gap-2 text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Pesquisando...</span>
                      </div>
                    )
                  }
                  if (part.state === 'output-available') {
                    return (
                      <div key={index} className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          ✓ Pesquisa concluída
                        </span>
                      </div>
                    )
                  }
                }

                // Artefatos criados
                if (
                  part.type === 'tool-createSummary' ||
                  part.type === 'tool-createFlashcards' ||
                  part.type === 'tool-createMindMap'
                ) {
                  if (part.state === 'input-available') {
                    return (
                      <div key={index} className="flex items-center gap-2 text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Criando material...</span>
                      </div>
                    )
                  }
                  if (part.state === 'output-available' && (part.output as any)?.success) {
                    return (
                      <div key={index} className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {(part.output as any)?.message}
                        </span>
                      </div>
                    )
                  }
                  if (part.state === 'output-error') {
                    return (
                      <div key={index} className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                        <span className="text-sm text-red-700 dark:text-red-300">
                          Erro ao criar material
                        </span>
                      </div>
                    )
                  }
                }

                return null
              })}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {status === 'submitted' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 max-w-md text-center">
              <p className="text-sm font-medium">
                {(error.message ?? '').includes('credits_exhausted') || (error.message ?? '').includes('402')
                  ? '✦ Créditos esgotados'
                  : 'Não foi possível gerar a resposta'}
              </p>
              <p className="text-xs mt-1 opacity-80">
                {(error.message ?? '').includes('credits_exhausted') || (error.message ?? '').includes('402')
                  ? 'Você atingiu o limite mensal do seu plano. Faça upgrade para continuar.'
                  : 'Ocorreu um erro inesperado. Tente novamente.'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Button
            type="button"
            variant={isListening ? "destructive" : "ghost"}
            size="icon"
            onClick={toggleVoiceInput}
            className={cn("shrink-0", isListening && "animate-pulse ring-2 ring-red-500 ring-offset-2")}
            disabled={isLoading}
            title="Gravar áudio"
          >
            {isListening ? (
              <StopCircle className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta ou use o microfone..."
            disabled={isLoading}
            rows={1}
            className="resize-none min-h-[44px] max-h-[200px]"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stop()}
              className="shrink-0"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          O MedVision pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  )
}
