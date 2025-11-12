"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Loader2, User, Bot, Copy, RotateCcw } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          message: userMessage.content,
          plan: "free",
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const regenerateLastMessage = async () => {
    if (messages.length < 2 || isLoading) return

    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")
    if (!lastUserMessage) return

    setMessages((prev) => prev.slice(0, -1))
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          message: lastUserMessage.content,
          plan: "free",
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Odonto GPT
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-md">
                Seu assistente inteligente de odontologia. Faça suas perguntas e obtenha respostas baseadas em conhecimento especializado.
              </p>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                <button
                  onClick={() => setInput("Quais são os principais sinais de periodontite?")}
                  className="p-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 hover:border-cyan-500/80 hover:bg-slate-800 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-cyan-400 font-medium">
                    Quais são os principais sinais de periodontite?
                  </p>
                </button>
                <button
                  onClick={() => setInput("Como diagnosticar cárie profunda?")}
                  className="p-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 hover:border-cyan-500/80 hover:bg-slate-800 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-cyan-400 font-medium">
                    Como diagnosticar cárie profunda?
                  </p>
                </button>
                <button
                  onClick={() => setInput("Protocolo de tratamento endodôntico")}
                  className="p-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 hover:border-cyan-500/80 hover:bg-slate-800 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-cyan-400 font-medium">
                    Protocolo de tratamento endodôntico
                  </p>
                </button>
                <button
                  onClick={() => setInput("Orientações pós-operatórias para implante")}
                  className="p-4 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 hover:border-cyan-500/80 hover:bg-slate-800 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-cyan-400 font-medium">
                    Orientações pós-operatórias para implante
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Messages List */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-slate-800/80 border border-slate-700/50 text-slate-100 shadow-lg"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {message.role === "assistant" && message.id === messages[messages.length - 1]?.id && !isLoading && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-2 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={regenerateLastMessage}
                      className="p-2 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Regenerar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-2xl px-6 py-4 bg-slate-800/80 border border-slate-700/50 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-slate-300">Pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-700/50 focus:border-cyan-500/80 focus:outline-none resize-none bg-slate-800/80 text-slate-100 placeholder:text-slate-500 transition-colors"
                style={{
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Pressione Enter para enviar • Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
