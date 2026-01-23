"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useChat, type Message } from "@ai-sdk/react"
import { Sparkles, Paperclip, X, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Markdown } from "@/components/chat/markdown"
import { ModernChatInput } from "@/components/dashboard/modern-chat-input"
import { motion, AnimatePresence } from "motion/react"
import { listAgents, getAgentConfig, type AgentConfig } from "@/lib/ai/agents/config"
import { getAgentUI } from "@/lib/ai/agents/ui-config"
import { ArtifactRenderer, type Artifact } from "@/components/artifacts"
import type { ArtifactKind } from "@/components/artifacts/types"

interface OdontoAIChatProps {
  userId?: string
  agentId?: string
  initialMessages?: Message[]
  initialChatId?: string
  userName?: string
}

// Map tool result types to artifact kinds
function mapToolTypeToArtifactKind(toolName: string): ArtifactKind | null {
  const mapping: Record<string, ArtifactKind> = {
    createSummary: 'summary',
    createFlashcards: 'flashcard',
    createQuiz: 'quiz',
    createResearch: 'research',
    createReport: 'report',
  }
  return mapping[toolName] || null
}

// Convert tool result to artifact
function toolResultToArtifact(toolName: string, result: any): Artifact | null {
  const kind = mapToolTypeToArtifactKind(toolName)
  if (!kind || !result) return null

  // The result already has the correct structure from our tools
  return {
    ...result,
    kind,
    id: result.id || `artifact-${Date.now()}`,
    title: result.title,
    createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
  } as Artifact
}

export function OdontoAIChat({
  userId,
  agentId = 'odonto-gpt',
  initialMessages = [],
  initialChatId,
  userName
}: OdontoAIChatProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(getAgentConfig(agentId))
  const [attachments, setAttachments] = useState<FileList | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const agents = listAgents()

  const [chatId] = useState(() => initialChatId || crypto.randomUUID())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Use AI SDK chat hook
  const {
    messages,
    input = "",
    setInput: setInputFromHook,
    handleSubmit: submitChat,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages,
    body: {
      agentId: selectedAgent.id,
      userId,
      chatId,
    },
    onError: (error) => {
      console.error("[OdontoAIChat] Error:", error)
      toast.error("Erro no chat", { description: error.message })
    },
    onFinish: (message) => {
      console.log("[OdontoAIChat] Message complete:", message.id)
    },
  })

  // Safe wrapper for setInput to prevent undefined issues
  const setInput = useCallback((value: string) => {
    if (typeof setInputFromHook === 'function') {
      setInputFromHook(value)
    } else {
      console.error("[OdontoAIChat] setInput is not a function")
    }
  }, [setInputFromHook])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle agent change
  const handleAgentChange = useCallback((newAgent: AgentConfig) => {
    if (newAgent.id === selectedAgent.id) return

    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedAgent(newAgent)
      setIsTransitioning(false)
      toast.success(`Agente alterado para ${newAgent.name}`)
    }, 300)
  }, [selectedAgent.id])

  const handleFileSelect = (file: File) => {
    const dt = new DataTransfer()
    dt.items.add(file)
    setAttachments(dt.files)
    toast.success("Arquivo anexado!")
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedInput = (input || "").trim()
    if (trimmedInput && !isLoading) {
      submitChat(e, {
        body: {
          agentId: selectedAgent.id,
          userId,
          chatId,
        },
      })
      setAttachments(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const suggestions = [
    "Anatomia do primeiro molar",
    "Preparo cavitário classe I",
    "Protocolo de anestesia",
    "Tratamento endodôntico",
  ]

  // Render message content with artifacts
  const renderMessageContent = (message: Message) => {
    const parts = message.parts || []
    const textParts: string[] = []
    const artifacts: Artifact[] = []

    // Process parts
    parts.forEach((part) => {
      if (part.type === 'text') {
        textParts.push(part.text)
      } else if (part.type === 'tool-invocation' && part.toolInvocation) {
        const { toolName, state, result } = part.toolInvocation
        if (state === 'result' && result) {
          const artifact = toolResultToArtifact(toolName, result)
          if (artifact) {
            artifacts.push(artifact)
          }
        }
      }
    })

    // Fallback to content if no parts
    const textContent = textParts.length > 0 ? textParts.join('\n') : message.content

    return (
      <>
        {textContent && <Markdown>{textContent}</Markdown>}
        {artifacts.map((artifact) => (
          <div key={artifact.id} className="mt-4">
            <ArtifactRenderer artifact={artifact} />
          </div>
        ))}
      </>
    )
  }

  // Render tool invocation status (loading state)
  const renderToolStatus = (message: Message) => {
    const parts = message.parts || []
    const pendingTools = parts.filter(
      (part) => part.type === 'tool-invocation' && part.toolInvocation?.state === 'call'
    )

    if (pendingTools.length === 0) return null

    return pendingTools.map((part, index) => {
      if (part.type !== 'tool-invocation' || !part.toolInvocation) return null
      const { toolName, args } = part.toolInvocation

      const toolLabels: Record<string, string> = {
        createSummary: 'Criando resumo...',
        createFlashcards: 'Gerando flashcards...',
        createQuiz: 'Preparando simulado...',
        createResearch: 'Pesquisando...',
        createReport: 'Analisando...',
        askPerplexity: 'Pesquisando na web...',
        searchPubMed: 'Buscando no PubMed...',
      }

      return (
        <motion.div
          key={`${toolName}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 py-2 px-3 mt-2 rounded-lg bg-muted/50 border border-border/50"
        >
          <Wrench className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">
            {toolLabels[toolName] || `Executando ${toolName}...`}
          </span>
        </motion.div>
      )
    })
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen flex-col bg-background relative font-sans text-foreground overflow-hidden">
      {/* Agent Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center",
                `bg-gradient-to-br ${getAgentUI(selectedAgent.id).gradient}`
              )}
            >
              {(() => {
                const Icon = getAgentUI(selectedAgent.id).icon
                return <Icon className="h-8 w-8 text-white animate-pulse" />
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 custom-scrollbar scroll-smooth">
        <div className="mx-auto max-w-3xl flex flex-col justify-start min-h-full pb-32 md:pb-32">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedAgent.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className={cn(
                      "h-12 w-12 md:h-16 md:w-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/50 shadow-xl",
                      `bg-gradient-to-br transition-all duration-500`,
                      getAgentUI(selectedAgent.id).gradient
                    )}
                  >
                    {(() => {
                      const Icon = getAgentUI(selectedAgent.id).icon
                      return <Icon className="h-5 w-5 md:h-7 md:w-7 text-white" />
                    })()}
                  </motion.div>
                </AnimatePresence>
                <motion.div
                  key={`glow-${selectedAgent.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className={cn(
                    "absolute -inset-4 blur-3xl -z-10 rounded-full",
                    `bg-gradient-to-br ${getAgentUI(selectedAgent.id).gradient.replace('from-', 'to-')}`
                  )}
                />
              </div>

              <div className="space-y-2 max-w-md">
                <motion.h2
                  key={`title-${selectedAgent.id}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-lg md:text-2xl font-heading font-semibold text-foreground"
                >
                  {selectedAgent.id === 'odonto-gpt' ? `Olá, ${userName || 'Doutor(a)'}` : selectedAgent.greetingTitle}
                </motion.h2>
                <motion.p
                  key={`desc-${selectedAgent.id}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm md:text-base text-muted-foreground"
                >
                  {selectedAgent.greetingDescription || "Como posso ajudar você hoje?"}
                </motion.p>
              </div>

              <div className="flex flex-row overflow-x-auto w-full max-w-[90vw] gap-2 pb-2 md:flex-col md:items-center md:w-full md:pb-0 scrollbar-hide snap-x">
                {suggestions.map((s, index) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    key={s}
                    onClick={() => {
                      if (typeof setInput === 'function') {
                        setInput(s)
                      }
                    }}
                    className="flex-shrink-0 snap-center px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm text-center rounded-2xl bg-card border border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap w-auto min-w-[200px]"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {messages.map((message) => (
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
                      ? "px-5 py-3 rounded-[20px] bg-muted/40 text-foreground border border-border/10 rounded-br-sm"
                      : "pl-0 pr-4 py-1 bg-transparent"
                  )}>
                    {message.role === "assistant" && !message.content && isLoading && !message.parts?.length ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground/70 animate-pulse">
                        <Sparkles className="h-4 w-4" />
                        <span>Pensando...</span>
                      </div>
                    ) : (
                      <>
                        {renderMessageContent(message)}
                        {message.role === "assistant" && isLoading && renderToolStatus(message)}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-4xl pointer-events-auto">
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
            setSelectedAgent={handleAgentChange}
            isLoading={isLoading}
            isReady={!isLoading}
            handleKeyDown={handleKeyDown}
            inputRef={inputRef}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>
    </div>
  )
}
