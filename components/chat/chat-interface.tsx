"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Send, Loader2, User, Bot, Copy, RotateCcw, CheckCheck, ImagePlus, X } from "lucide-react"
import { Streamdown } from "streamdown"
import Image from "next/image"

import { nanoid } from "nanoid"
import { ImageUpload, type UploadedImage } from "./image-upload"

type ChatInterfaceProps = {
  plan?: string
  userId?: string
}

export function ChatInterface({ plan = "free", userId = "" }: ChatInterfaceProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

  // Generate a stable session ID for this component instance
  const [sessionId] = useState(() => nanoid())

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      plan,
      sessionId,
      imageUrl: uploadedImages.length > 0 ? uploadedImages[0].url : undefined,
    },
    onError: (err) => {
      console.error("[Chat] Erro:", err)
    },
    onFinish: () => {
      // Clear uploaded images after message is sent
      setUploadedImages([])
      setShowImageUpload(false)
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyMessage = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(messageId)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Simular digitação da sugestão
    const syntheticEvent = {
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLTextAreaElement>
    handleInputChange(syntheticEvent)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-16 h-16 flex items-center justify-center mb-6">
                <Bot className="w-12 h-12 text-slate-400" />
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
                  onClick={() => handleSuggestionClick("Quais são os principais sinais de periodontite?")}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-white font-medium">
                    Quais são os principais sinais de periodontite?
                  </p>
                </button>
                <button
                  onClick={() => handleSuggestionClick("Como diagnosticar cárie profunda?")}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-white font-medium">
                    Como diagnosticar cárie profunda?
                  </p>
                </button>
                <button
                  onClick={() => handleSuggestionClick("Protocolo de tratamento endodôntico")}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-white font-medium">
                    Protocolo de tratamento endodôntico
                  </p>
                </button>
                <button
                  onClick={() => handleSuggestionClick("Orientações pós-operatórias para implante")}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left group"
                >
                  <p className="text-sm text-slate-300 group-hover:text-white font-medium">
                    Orientações pós-operatórias para implante
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 max-w-md">
                <p className="text-red-400 text-sm text-center">
                  {error.message || "Ocorreu um erro. Tente novamente."}
                </p>
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
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-slate-400" />
                </div>
              )}

              <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                <div
                  className={`rounded-2xl px-6 py-4 ${message.role === "user"
                    ? "bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] text-white shadow-lg"
                    : "bg-slate-800/80 border border-slate-700/50 text-slate-100 shadow-lg"
                    }`}
                >
                  <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-black/20 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-black/20 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic">
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                </div>

                {message.role === "assistant" && message.id === messages[messages.length - 1]?.id && !isLoading && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => copyMessage(message.content, message.id)}
                      className="p-2 rounded-lg bg-slate-900/40 border border-slate-700/50 text-slate-400 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white transition-all"
                      title="Copiar"
                    >
                      {copied === message.id ? (
                        <CheckCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => reload()}
                      className="p-2 rounded-lg bg-slate-900/40 border border-slate-700/50 text-slate-400 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white transition-all"
                      title="Regenerar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
          ))}

          {/* Loading State */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-slate-400" />
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
      <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {/* Image Upload Section */}
          {showImageUpload && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowImageUpload(false)}
                className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <ImageUpload
                images={uploadedImages}
                onImagesChange={setUploadedImages}
                maxFiles={1}
                userId={userId}
                disabled={isLoading}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            {/* Image Upload Toggle Button */}
            <button
              type="button"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2
                ${
                  showImageUpload || uploadedImages.length > 0
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-slate-800/80 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              title={showImageUpload ? "Fechar upload" : "Adicionar imagem"}
              disabled={isLoading}
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  uploadedImages.length > 0
                    ? "Descreva o que você quer analisar na imagem..."
                    : "Digite sua pergunta..."
                }
                rows={1}
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-700/50 focus:border-primary/50 focus:outline-none resize-none bg-slate-800/80 text-slate-100 placeholder:text-slate-500 transition-all backdrop-blur-sm disabled:opacity-50"
                style={{
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={(!input.trim() && uploadedImages.length === 0) || isLoading}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] hover:bg-[linear-gradient(135deg,#0e7490_0%,#0891b2_100%)] disabled:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-all disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Upload Status */}
          {uploadedImages.length > 0 && uploadedImages.some((img) => img.uploading) && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Fazendo upload das imagens...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
