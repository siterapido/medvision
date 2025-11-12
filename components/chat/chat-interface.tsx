"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import type { ChatStatus } from "ai"
import clsx from "clsx"
import { CopyIcon, RefreshCcwIcon, Share2Icon, Sparkles } from "lucide-react"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input"
import { Response } from "@/components/ai-elements/response"
import { Action, Actions } from "@/components/ai-elements/actions"
import { Loader } from "@/components/ai-elements/loader"
import { Button } from "@/components/ui/button"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o Odonto GPT, seu assistente de IA em odontologia. Como posso ajudar hoje?",
      timestamp: new Date(),
    },
  ])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [input, setInput] = useState("")
  const idCounterRef = useRef(0)

  const nextMessageId = (label?: string) => {
    idCounterRef.current += 1
    return label ? `msg-${idCounterRef.current}-${label}` : `msg-${idCounterRef.current}`
  }

  useEffect(() => {
    // noop - Conversation handles stick-to-bottom
  }, [messages])

  useEffect(() => {
    const className = "chat-scroll-lock"
    document.body.classList.add(className)
    return () => {
      document.body.classList.remove(className)
    }
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || status === "submitted" || status === "streaming") return

    const userMessage: ChatMessage = {
      id: nextMessageId("user"),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setStatus("submitted")
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          message: text,
          plan: "free",
        }),
      })

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: nextMessageId("assistant"),
        role: "assistant",
        content: data.reply || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStatus("idle")
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId("error"),
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date(),
        },
      ])
      setStatus("error")
      setTimeout(() => setStatus("idle"), 1200)
    }
  }

  const regenerateMessage = async (messageIndex: number) => {
    if (status === "submitted" || status === "streaming") return

    const messageToRegenerate = messages[messageIndex - 1]
    if (!messageToRegenerate || messageToRegenerate.role !== "user") return

    // Remove last assistant response
    setMessages((prev) => prev.slice(0, -1))
    setStatus("submitted")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          message: messageToRegenerate.content,
          plan: "free",
        }),
      })

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: nextMessageId("assistant-regen"),
        role: "assistant",
        content: data.reply || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStatus("idle")
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId("error"),
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date(),
        },
      ])
      setStatus("error")
      setTimeout(() => setStatus("idle"), 1200)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyAllMessages = () => {
    const allText = messages
      .map((m) => `${m.role === "user" ? "Você" : "Odonto GPT"}: ${m.content}`)
      .join("\n\n")
    navigator.clipboard.writeText(allText)
  }

  const shareChat = () => {
    const allText = messages
      .map((m) => `${m.role === "user" ? "Você" : "Odonto GPT"}: ${m.content}`)
      .join("\n\n")
    if (navigator.share) {
      navigator.share({
        title: "Conversa Odonto GPT",
        text: allText,
      })
    }
  }

  return (
    <div className="chat-shell relative isolate grid h-full w-full grid-rows-[auto_minmax(0,_1fr)_auto] bg-gradient-to-b from-[#0F192F] via-[#101C34] to-[#0B1423] text-[#E6EDF7]">
      {/* Header com botões de copiar e compartilhar */}
      <div className="sticky top-0 z-20 relative overflow-hidden border-b border-[#1f2d4a] bg-gradient-to-r from-[#0F192F]/90 via-[#111B2D]/90 to-[#0B1423]/90 px-6 py-5 shadow-sm backdrop-blur-sm backdrop-saturate-150">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-8 top-5 h-32 w-32 rounded-full bg-[#2399B4]/30 blur-[70px]" />
          <div className="absolute right-6 top-4 h-28 w-28 rounded-full bg-[#06b6d4]/30 blur-[60px]" />
          <div className="absolute inset-x-6 bottom-2 h-16 rounded-full bg-[radial-gradient(circle,rgba(35,153,180,0.25),transparent_70%)] opacity-60 blur-[40px]" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 text-white sm:flex-row sm:items-end sm:gap-4">
              <Sparkles className="h-6 w-6 text-[#06b6d4]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-white">
                  Chat Odonto GPT
                </h2>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={copyAllMessages}
              variant="outline"
              size="sm"
              className="rounded-2xl border border-[#1f2d4a] bg-[#0F172A]/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_30px_rgba(3,7,18,0.45)] transition-colors hover:border-[#06b6d4] hover:bg-[#091024] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button
              onClick={shareChat}
              variant="outline"
              size="sm"
              className="rounded-2xl border border-[#1f2d4a] bg-[#0F172A]/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_30px_rgba(3,7,18,0.45)] transition-colors hover:border-[#06b6d4] hover:bg-[#091024] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
            >
              <Share2Icon className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 overflow-hidden">
        <Conversation className="flex h-full flex-col overscroll-contain bg-transparent px-4 py-6 sm:px-6">
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Envie sua primeira pergunta para começar"
            title="Sem mensagens ainda"
            className="text-slate-200"
          />
        ) : (
          <ConversationContent className="mx-auto w-full max-w-4xl space-y-5 px-0">
            {messages.map((message, index) => (
              <Fragment key={message.id}>
                <Message from={message.role} className="mb-1">
                  <MessageContent
                    className={clsx(
                      "rounded-2xl border px-5 py-4 text-sm leading-relaxed max-w-[85%]",
                      message.role === "user" ? "ml-auto border-[#1f8ab1]/40 bg-[#0F172A] text-white" : "mr-auto border-[#1f2d4a] bg-[#131F36] text-[#E6EDF7]"
                    )}
                  >
                    <Response className="text-sm leading-relaxed">{message.content}</Response>
                  </MessageContent>
                </Message>

                {message.role === "assistant" && index === messages.length - 1 && status === "idle" && (
                  <Actions
                    className="mt-2 mb-2 flex gap-2 text-[#E6EDF7]"
                  >
                    <Action
                      onClick={() => regenerateMessage(index)}
                      label="Regenerar"
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-center transition-colors shadow-[0_15px_40px_rgba(15,23,42,0.12)]",
                        "border-[#1f2d4a] bg-[#121c31] text-[#E6EDF7] hover:border-[#2399B4]"
                      )}
                    >
                      <RefreshCcwIcon className="h-3.5 w-3.5 text-inherit" />
                    </Action>
                    <Action
                      onClick={() => copyToClipboard(message.content)}
                      label="Copiar"
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-center transition-colors shadow-[0_15px_40px_rgba(15,23,42,0.12)]",
                        "border-[#1f2d4a] bg-[#121c31] text-[#E6EDF7] hover:border-[#2399B4]"
                      )}
                    >
                      <CopyIcon className="h-3.5 w-3.5 text-inherit" />
                    </Action>
                  </Actions>
                )}
              </Fragment>
            ))}
            {status === "submitted" && (
              <div
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3 border-[#1f2d4a] bg-[#121a30]/70"
                )}
              >
                <div
                  className={clsx(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#1f2d4a] bg-[#10192c]"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-[#06b6d4]" />
                </div>
                <Loader className="text-sm text-[#E6EDF7]" />
              </div>
            )}
          </ConversationContent>
        )}
        <ConversationScrollButton
          className={clsx(
            "rounded-full border text-sm transition-colors shadow-[0_15px_35px_rgba(15,23,42,0.12)]",
            "border-[#1f2d4a] bg-[#131f36] text-[#E6EDF7] hover:border-[#2399B4] hover:text-white"
          )}
        />
      </Conversation>
    </div>

      <div
        className={clsx(
          "sticky bottom-0 z-20 border-t border-[#1f2d4a] bg-[#0F172A]/95 p-5 backdrop-blur"
        )}
      >
        <div className="mx-auto w-full max-w-4xl">
          <PromptInput
            onSubmit={({ text }) => {
              return sendMessage(text)
            }}
            className={clsx(
              "rounded-2xl border transition-colors focus-within:ring-0 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border-[#1f2d4a] bg-[#101a30] hover:border-[#2399B4]"
            )}
          >
            <PromptInputBody className="p-4">
              <PromptInputTextarea
                placeholder="Digite sua dúvida clínica..."
                className={clsx(
                  "resize-none bg-transparent text-sm",
                  "text-[#E6EDF7] placeholder:text-slate-400/70"
                )}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-center justify-end px-4 pb-4 pt-2">
              <PromptInputSubmit
                status={status === "idle" ? undefined : status}
                disabled={!input.trim() && status === "idle"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0891b2] via-[#06b6d4] to-[#22d3ee] text-[#0B1627] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </PromptInputFooter>
          </PromptInput>
          <p
            className={clsx(
              "mt-3 text-center text-xs text-slate-400"
            )}
          >
            Pressione Enter para enviar, Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
