"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export function FloatingChat() {
  const pathname = usePathname()
  const shouldHide = pathname === "/dashboard/chat"
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

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

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setMessages((m) => [...m, { role: "user", content: text }])
    setInput("")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        const errText = await res.text()
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Falha ao enviar: ${errText}` },
        ])
      } else {
        const data = (await res.json()) as { reply?: string }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply ?? "(sem resposta)" },
        ])
      }
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Erro de rede. Tente novamente." },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        aria-label={buttonLabel}
        aria-expanded={open}
        title="Odonto GPT"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-center rounded-full border-2",
          "bg-[#0F192F] border-[rgba(8,145,178,1)] shadow-lg",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-[rgba(8,145,178,1)]",
          "w-[50px] h-[50px] md:w-[60px] md:h-[60px]",
          "hover:bg-[#131D37] active:scale-95"
        )}
      >
        <Logo width={Math.floor(0.7 * 60)} height={Math.floor(0.7 * 60)} className="md:block hidden" variant="white" />
        <Logo width={Math.floor(0.7 * 50)} height={Math.floor(0.7 * 50)} className="md:hidden block" variant="white" />
        <span className="sr-only">Odonto GPT</span>
      </button>

      <div
        className={cn(
          "absolute md:bottom-[72px] bottom-[62px] right-0", // botão 60px (md) / 50px (mobile)
          "md:w-[300px] md:h-[400px] w-[280px] h-[380px]",
          "rounded-xl border border-[#24324F] bg-[linear-gradient(135deg,#0F192F_0%,#131D37_35%,#1A2847_65%,#131D37_100%)] shadow-2xl",
          "transition-all duration-200",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        )}
        role="dialog"
        aria-label="Mini-chat Odonto GPT"
        aria-modal="false"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#24324F] rounded-t-xl bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] text-white">
          <div className="flex items-center gap-2">
            <Logo width={24} height={24} variant="white" />
            <h2 className="text-sm font-semibold">Odonto GPT</h2>
          </div>
          <Button
            aria-label="Fechar chat"
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col h-[calc(100%-52px)]">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 text-white scroll-smooth"
            style={{ scrollbarColor: "#24324F #0F192F" as any, scrollbarWidth: "thin" as any }}
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-slate-300">Envie uma pergunta para começar.</p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto text-white bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)]"
                      : "mr-auto bg-[#16243F] text-white border border-[#24324F]"
                  )}
                >
                  {m.content}
                </div>
              ))
            )}
          </div>

          <form
            className="flex items-center gap-3 p-4 border-t border-[#24324F]"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Digite sua mensagem"
              aria-label="Mensagem"
              className="flex-1 bg-[#131D37] text-white placeholder:text-slate-300 border-[#24324F] focus:ring-2 focus:ring-[#0891b2] focus:outline-none"
            />
          </form>
        </div>
      </div>
    </div>
  )
}