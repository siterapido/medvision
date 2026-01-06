"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X, Send, Bot, User, Loader2 } from "lucide-react"
import { Streamdown } from "streamdown"

export function FloatingChat({ isTrialExpired = false }: { isTrialExpired?: boolean }) {
  const pathname = usePathname()
  const shouldHide = pathname === "/dashboard/chat" || isTrialExpired
  const [open, setOpen] = React.useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: "/api/chat",
    id: "floating-chat", // ID único para manter estado separado
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [open])

  const buttonLabel = useMemo(() => (open ? "Fechar mini-chat" : "Abrir mini-chat"), [open])

  if (shouldHide) {
    return null
  }

  const handleToggle = () => setOpen((v) => !v)

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleToggle()
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <div
        className={cn(
          "origin-bottom-right transition-all duration-300 ease-in-out",
          "absolute bottom-[calc(100%+16px)] right-0 z-50",
          "flex flex-col overflow-hidden",
          "rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-md shadow-2xl",
          "md:w-[400px] md:h-[600px] w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)]",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
        role="dialog"
        aria-label="Mini-chat Odonto GPT"
        aria-modal="false"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-white">Odonto GPT</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <Button
            aria-label="Fechar chat"
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth"
          style={{ scrollbarColor: "#334155 transparent", scrollbarWidth: "thin" }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4 opacity-0 animate-in fade-in duration-500 slide-in-from-bottom-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Como posso ajudar?</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">
                  Tire suas dúvidas sobre odontologia, procedimentos e diagnósticos.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={m.id || i}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  m.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-cyan-500 to-blue-600"
                )}>
                  {m.role === "user" ? (
                    <User className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  m.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-sm border border-slate-700"
                      : "bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 rounded-tl-sm border border-slate-700/50"
                  )}>
                    <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-black/20 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-black/20 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic">
                      <Streamdown>{m.content}</Streamdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/50 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form
            className="relative flex items-end gap-2"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={adjustTextareaHeight}
              onKeyDown={handleInputKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 bg-slate-800/50 text-white placeholder:text-slate-500 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none resize-none min-h-[44px] max-h-[120px] scrollbar-hide [&::-webkit-scrollbar]:hidden text-sm"
              style={{ scrollbarWidth: 'none' }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className={cn(
                "h-[44px] w-[44px] rounded-xl transition-all duration-200 shadow-lg",
                "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Send className="w-5 h-5 text-white ml-0.5" />
              )}
            </Button>
          </form>
        </div>
      </div>

      <button
        aria-label={buttonLabel}
        aria-expanded={open}
        title="Odonto GPT"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 shadow-lg shadow-cyan-900/20",
          "transition-all duration-300 ease-out hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          "w-14 h-14 md:w-16 md:h-16",
          open ? "rotate-90 opacity-0 pointer-events-none absolute" : "rotate-0 opacity-100"
        )}
      >
        <Logo width={32} height={32} variant="white" />
      </button>

      {/* Close button when open (replaces the toggle button) */}
      <button
        aria-label="Fechar"
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-slate-800 border border-slate-700 shadow-lg",
          "transition-all duration-300 ease-out hover:bg-slate-700 active:scale-95",
          "w-12 h-12",
          open ? "opacity-100 rotate-0" : "opacity-0 rotate-90 pointer-events-none absolute"
        )}
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

// Need to import React for useState
import React from "react"