"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Loader2, Sparkles, User, Bot, Paperclip, Plus, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Markdown } from "@/components/chat/markdown"

interface OdontoAIChatProps {
  userId?: string
}

export function OdontoAIChat({ userId }: OdontoAIChatProps) {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/newchat",
      body: {
        agentId: "odonto-gpt"
      },
    }),
    onError: (error) => {
      toast.error("Erro no chat", {
        description: error.message,
      })
    }
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isReady = status === 'ready'

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((input || "").trim() && isReady) {
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }]
      })
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }


  const suggestions = [
    "Me ajude a entender a anatomia do primeiro molar superior",
    "Quais os princípios básicos de preparo cavitário?",
    "Explique como funciona a anestesia local",
    "Tire minhas dúvidas sobre tratamento endodôntico",
  ]

  return (
    <div className="flex h-full flex-col bg-background relative font-sans text-foreground">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-6 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-6">

          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-2 text-3xl font-medium tracking-tight text-foreground">
                Como posso ajudar hoje?
              </h1>

              {/* Search Bar for Empty State */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="relative rounded-xl bg-card p-2 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
                  <form onSubmit={handleSubmit}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Faça uma pergunta sobre odontologia..."
                      rows={1}
                      className="w-full resize-none bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted-foreground"
                      style={{ minHeight: "56px", maxHeight: "200px" }}
                    />
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex gap-2">
                        <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Paperclip className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !(input || "").trim() || !isReady}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                          ((input || "").trim() && isReady)
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                      }}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="group relative">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border border-border bg-card">
                      {message.role === "user" ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="font-medium text-foreground">
                        {message.role === "user" ? "Você" : "Odonto GPT"}
                      </div>
                      <div className="prose prose-zinc max-w-none dark:prose-invert">
                        {message.parts.map((part, i) => {
                          if (part.type === 'text') {
                            return <Markdown key={i}>{part.text}</Markdown>
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>
      </div>

      {/* Fixed Input Area for Chat State */}
      {messages.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10">
          <div className="mx-auto max-w-3xl px-4">
            <div className="relative rounded-xl bg-card p-2 shadow-lg ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
              <form onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Faça uma pergunta..."
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground"
                  style={{ minHeight: "44px", maxHeight: "200px" }}
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex gap-2">
                    <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !(input || "").trim() || !isReady}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                      ((input || "").trim() && isReady)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              O Odonto GPT pode cometer erros. Verifique as informações importantes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
