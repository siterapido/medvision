"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, UIMessage } from "ai"
import { Loader2, Sparkles, Paperclip, ArrowUp, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Markdown } from "@/components/chat/markdown"
import { ArtifactRenderer, Artifact } from "@/components/chat/artifact-renderer"
import { AgentSelector } from "@/components/agno-chat/agent-selector"
import { ModernChatInput } from "@/components/dashboard/modern-chat-input"
import { motion, AnimatePresence } from "framer-motion"
import { listAgents, getAgentConfig, type AgentConfig } from "@/lib/ai/agents/config"
import { getAgentUI } from "@/lib/ai/agents/ui-config"

interface OdontoAIChatProps {
  userId?: string
  agentId?: string
  initialMessages?: any[]
  initialChatId?: string
  userName?: string
}

export function OdontoAIChat({
  userId,
  agentId = 'odonto-gpt',
  initialMessages = [],
  initialChatId,
  userName
}: OdontoAIChatProps) {
  const [input, setInput] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(getAgentConfig(agentId))
  const [attachments, setAttachments] = useState<FileList | null>(null)
  const agents = listAgents()

  // Ensure we have a stable chatId for the session
  const [chatId] = useState(() => initialChatId || crypto.randomUUID())

  // Memoize transport to ensure it updates when dependencies change but stays stable otherwise.
  // This fixes the 'api' property lint error by using the expected transport configuration.
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/newchat",
    body: {
      agentId: selectedAgent.id,
      userId,
      chatId
    },
  }), [selectedAgent.id, userId, chatId])

  // Cast to any to avoid type issues with 'append' if the installed SDK version has type mismatches
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    messages: initialMessages?.map(m => ({
      ...m,
      parts: m.parts || [{ type: 'text', text: m.content || "" }]
    })) as any || [],
    onError: (error: any) => {
      toast.error("Erro no chat", {
        description: error.message,
      })
    }
  })

  // Loading states
  const isLoading = status === 'submitted' || status === 'streaming'
  const isReady = !isLoading // Allow sending as long as not currently loading (e.g. ready, error, initial)

  // Refs for scrolling and auto-resize
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  const handleFileSelect = (file: File) => {
    // For simplicity, overwriting current selection. Could be appended.
    const dt = new DataTransfer()
    dt.items.add(file)
    setAttachments(dt.files)
    toast.success("Arquivo anexado!")
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((input || attachments) && !isLoading) { // Use !isLoading instead of isReady for clearer logic override
      const experimental_attachments = attachments ? await Promise.all(
        Array.from(attachments).map(async (file) => {
          const contentType = file.type
          let url = ''

          // Attempt upload first
          try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            if (res.ok) {
              const data = await res.json()
              url = data.url
            }
          } catch (e) {
            console.error("Upload failed", e)
          }

          if (!url) {
            url = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
          }
          return { contentType, url, name: file.name }
        })
      ) : undefined

      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
        experimental_attachments
      } as any)
      setInput("")
      setAttachments(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Helper: Extract artifacts from tool calls
  const extractArtifact = (part: any): Artifact | null => {
    if (part.type?.startsWith('tool-') && part.state === 'output-available') {
      const output = part.output
      if (output && typeof output === 'object' && output.type && output.title) {
        return output as Artifact
      }
    }
    return null
  }

  const suggestions = [
    "Anatomia do primeiro molar",
    "Preparo cavitário classe I",
    "Protocolo de anestesia",
    "Tratamento endodôntico",
  ]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen flex-col bg-background relative font-sans text-foreground overflow-hidden">

      {/* Messages Area - App Style Scroll */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 custom-scrollbar scroll-smooth">
        <div className="mx-auto max-w-3xl flex flex-col justify-start min-h-full pb-24">
          {/* pb-24 ensures vital space for fixed input */}

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedAgent.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className={cn(
                      "h-16 w-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/50 shadow-xl",
                      `bg-gradient-to-br transition-all duration-500`,
                      getAgentUI(selectedAgent.id).gradient
                    )}
                  >
                    {(() => {
                      const Icon = getAgentUI(selectedAgent.id).icon
                      return <Icon className="h-8 w-8 text-white" />
                    })()}
                  </motion.div>
                </AnimatePresence>

                {/* Subtle outer glow that matches the agent theme */}
                <motion.div
                  key={`glow-${selectedAgent.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className={cn(
                    "absolute -inset-4 blur-2xl -z-10 rounded-full",
                    `bg-gradient-to-br ${getAgentUI(selectedAgent.id).gradient.replace('from-', 'to-')}`
                  )}
                />
              </div>

              <div className="space-y-2 max-w-md">
                <motion.h2
                  key={`title-${selectedAgent.id}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-heading font-medium text-foreground"
                >
                  {selectedAgent.id === 'odonto-gpt' ? `Olá, ${userName || 'Doutor(a)'}` : selectedAgent.greetingTitle}
                </motion.h2>
                <motion.p
                  key={`desc-${selectedAgent.id}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground"
                >
                  {selectedAgent.greetingDescription || "Como posso ajudar você hoje?"}
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="px-4 py-3 text-sm text-left rounded-xl bg-card border border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all text-muted-foreground hover:text-foreground truncate shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col max-w-[90%] md:max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-300",
                    message.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "prose prose-zinc dark:prose-invert max-w-none break-words text-base leading-relaxed",
                    message.role === "user"
                      ? "px-5 py-3 rounded-[20px] bg-muted/40 text-foreground border border-border/10 rounded-br-sm" // User Bubble: Modern & Subtle
                      : "pl-0 pr-4 py-1 bg-transparent" // AI: Clean text, no bubble
                  )}>
                    {((message as any).parts || [{ type: 'text', text: (message as any).content || "" }]).map((part: any, i: number) => {
                      if (part.type === 'text') {
                        return <Markdown key={i}>{part.text}</Markdown>
                      }
                      // Artifacts & Tools
                      if (part.type?.startsWith('tool-')) {
                        const artifact = extractArtifact(part)
                        if (artifact) return <ArtifactRenderer key={i} artifact={artifact} />
                        if (part.state === 'input-available' || part.state === 'input-streaming') {
                          return (
                            <div key={i} className="flex items-center gap-2 py-2 text-sm text-muted-foreground/70 animate-pulse">
                              <Sparkles className="h-4 w-4" />
                              <span>Analisando...</span>
                            </div>
                          )
                        }
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>
      </div>

      {/* Modern Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
          {/* Attachment Preview */}
          {attachments && attachments.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {Array.from(attachments).map((file, i) => (
                <div key={i} className="relative group bg-muted/80 backdrop-blur-sm rounded-lg p-2 border border-border/50 flex items-center gap-2 max-w-[200px]">
                  <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs truncate">{file.name}</span>
                  <button
                    onClick={() => setAttachments(null)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <ModernChatInput
            input={input}
            setInput={setInput}
            onSend={handleSubmit}
            agents={agents}
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            isLoading={isLoading}
            isReady={isReady}
            handleKeyDown={handleKeyDown}
            inputRef={inputRef}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

    </div>
  )
}
