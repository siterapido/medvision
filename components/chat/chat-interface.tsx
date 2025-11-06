"use client"

import { useEffect, useState } from "react"
import type { ChatStatus } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"

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
      // Return to idle after a short delay so user can resend
      setTimeout(() => setStatus("idle"), 1200)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Envie sua primeira pergunta para começar"
            title="Sem mensagens ainda"
          />
        ) : (
          <ConversationContent>
            {messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  <MessageResponse>{m.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-card p-3">
        <div className="mx-auto w-full max-w-4xl">
          <PromptInput
            onSubmit={({ text }) => {
              return sendMessage(text)
            }}
            className=""
          >
            <PromptInputBody>
              <PromptInputTextarea placeholder="Digite sua dúvida clínica..." />
              <PromptInputSubmit status={status === "idle" ? undefined : status} />
            </PromptInputBody>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pressione Enter para enviar, Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
