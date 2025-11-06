"use client"

import { Fragment, useEffect, useState } from "react"
import type { ChatStatus } from "ai"
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
import { CopyIcon, RefreshCcwIcon, Sparkles } from "lucide-react"

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

  useEffect(() => {
    // noop - Conversation handles stick-to-bottom
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || status === "submitted" || status === "streaming") return

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
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
        id: `${Date.now()}-assistant`,
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
          id: `${Date.now()}-error`,
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
        id: `${Date.now()}-assistant-regen`,
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
          id: `${Date.now()}-error`,
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

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-white">
      <Conversation className="h-full">
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Envie sua primeira pergunta para começar"
            title="Sem mensagens ainda"
          />
        ) : (
          <ConversationContent className="px-4 py-6">
            {messages.map((message, index) => (
              <Fragment key={message.id}>
                <Message from={message.role} className="mb-4">
                  <MessageContent
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto max-w-[85%]"
                        : "bg-white border border-slate-200 text-slate-900"
                    }`}
                  >
                    <Response className="text-sm leading-relaxed">{message.content}</Response>
                  </MessageContent>
                </Message>

                {message.role === "assistant" && index === messages.length - 1 && status === "idle" && (
                  <Actions className="mt-2 mb-4 flex gap-1">
                    <Action
                      onClick={() => regenerateMessage(index)}
                      label="Regenerar"
                      className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <RefreshCcwIcon className="h-3.5 w-3.5 text-slate-600" />
                    </Action>
                    <Action
                      onClick={() => copyToClipboard(message.content)}
                      label="Copiar"
                      className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <CopyIcon className="h-3.5 w-3.5 text-slate-600" />
                    </Action>
                  </Actions>
                )}
              </Fragment>
            ))}
            {status === "submitted" && (
              <div className="flex items-start gap-3">
                <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Loader className="mt-1" />
              </div>
            )}
          </ConversationContent>
        )}
        <ConversationScrollButton className="rounded-full shadow-lg" />
      </Conversation>

      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="mx-auto w-full max-w-4xl">
          <PromptInput
            onSubmit={({ text }) => {
              return sendMessage(text)
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm hover:border-primary/50 focus-within:border-primary transition-colors"
          >
            <PromptInputBody className="p-3">
              <PromptInputTextarea
                placeholder="Digite sua dúvida clínica..."
                className="text-sm placeholder:text-slate-400 resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter className="px-3 pb-3 flex items-center justify-end">
              <PromptInputSubmit
                status={status === "idle" ? undefined : status}
                disabled={!input.trim() && status === "idle"}
                className="rounded-full h-9 w-9 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-slate-500">
            Pressione Enter para enviar, Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
