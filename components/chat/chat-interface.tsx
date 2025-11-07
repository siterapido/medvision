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
import { CopyIcon, RefreshCcwIcon, Sparkles, Share2Icon } from "lucide-react"
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
<<<<<<< HEAD
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-gradient-to-b from-[#0F192F] via-[#101C34] to-[#0B1423] text-[#E6EDF7]">
      {/* Header com botões de copiar e compartilhar */}
      <div className="flex items-center justify-between border-b border-[#1f2d4a] bg-[#111b2d]/90 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Chat Odonto GPT</h2>
=======
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header com botões de copiar e compartilhar */}
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-blue-900">Chat de IA</h2>
>>>>>>> origin/main
        <div className="flex gap-2">
          <Button
            onClick={copyAllMessages}
            variant="outline"
            size="sm"
<<<<<<< HEAD
            className="rounded-lg border-[#1f2d4a] bg-[#131f36] text-[#E6EDF7] transition-colors hover:border-[#2399B4] hover:text-white"
=======
            className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
>>>>>>> origin/main
          >
            <CopyIcon className="mr-2 h-4 w-4" />
            Copiar
          </Button>
          <Button
            onClick={shareChat}
            variant="outline"
            size="sm"
<<<<<<< HEAD
            className="rounded-lg border-[#1f2d4a] bg-[#131f36] text-[#E6EDF7] transition-colors hover:border-[#2399B4] hover:text-white"
=======
            className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
>>>>>>> origin/main
          >
            <Share2Icon className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <Conversation className="flex-1 bg-transparent px-4 py-6 sm:px-6">
=======
      <Conversation className="h-full bg-gradient-to-b from-blue-50/30 via-white to-blue-50/30">
>>>>>>> origin/main
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Envie sua primeira pergunta para começar"
            title="Sem mensagens ainda"
<<<<<<< HEAD
            className="text-slate-200"
          />
        ) : (
          <ConversationContent className="mx-auto w-full max-w-4xl space-y-5 px-0">
            {messages.map((message, index) => (
              <Fragment key={message.id}>
                <Message from={message.role} className="mb-1">
                  <MessageContent
                    className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "ml-auto max-w-[85%] border-[#1f8ab1]/40 bg-[#0F172A] text-white"
                        : "mr-auto max-w-[85%] border-[#1f2d4a] bg-[#131F36] text-[#E6EDF7]"
                    }`}
                  >
                    <Response className="text-sm leading-relaxed">{message.content}</Response>
                  </MessageContent>
                </Message>

                {message.role === "assistant" && index === messages.length - 1 && status === "idle" && (
                  <Actions className="mt-2 mb-2 flex gap-2 text-[#E6EDF7]">
                    <Action
                      onClick={() => regenerateMessage(index)}
                      label="Regenerar"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f2d4a] bg-[#121c31] text-[#E6EDF7] transition-colors hover:border-[#2399B4]"
                    >
                      <RefreshCcwIcon className="h-3.5 w-3.5 text-inherit" />
                    </Action>
                    <Action
                      onClick={() => copyToClipboard(message.content)}
                      label="Copiar"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f2d4a] bg-[#121c31] text-[#E6EDF7] transition-colors hover:border-[#2399B4]"
                    >
                      <CopyIcon className="h-3.5 w-3.5 text-inherit" />
                    </Action>
                  </Actions>
                )}
              </Fragment>
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#1f2d4a] bg-[#121a30]/70 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#1f2d4a] bg-[#10192c]">
                  <Sparkles className="h-4 w-4 text-[#06b6d4]" />
=======
            className="text-blue-900"
          />
        ) : (
          <ConversationContent className="px-4 py-6">
            <div className="mx-auto max-w-3xl">
              {messages.map((message, index) => (
                <Fragment key={message.id}>
                  <Message from={message.role} className="mb-4">
                    <MessageContent
                      className={`rounded-2xl px-4 py-3 shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto max-w-[85%]"
                          : "bg-white border border-blue-100 text-blue-950 mr-auto max-w-[85%] shadow-blue-100"
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
                        className="rounded-full h-8 w-8 flex items-center justify-center bg-white border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        <RefreshCcwIcon className="h-3.5 w-3.5 text-blue-700" />
                      </Action>
                      <Action
                        onClick={() => copyToClipboard(message.content)}
                        label="Copiar"
                        className="rounded-full h-8 w-8 flex items-center justify-center bg-white border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        <CopyIcon className="h-3.5 w-3.5 text-blue-700" />
                      </Action>
                    </Actions>
                  )}
                </Fragment>
              ))}
              {status === "submitted" && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full h-8 w-8 bg-blue-100 border border-blue-300 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <Loader className="mt-1" />
>>>>>>> origin/main
                </div>
                <Loader className="text-[#E6EDF7]" />
              </div>
            )}
          </ConversationContent>
        )}
<<<<<<< HEAD
        <ConversationScrollButton className="rounded-full border border-[#1f2d4a] bg-[#131f36] text-[#E6EDF7] hover:border-[#2399B4] hover:text-white" />
      </Conversation>

      <div className="border-t border-[#1f2d4a] bg-[#0F172A]/90 p-5">
        <div className="mx-auto w-full max-w-4xl">
=======
        <ConversationScrollButton className="rounded-full shadow-lg bg-white border border-blue-200 hover:bg-blue-50" />
      </Conversation>

      <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="mx-auto w-full max-w-3xl">
>>>>>>> origin/main
          <PromptInput
            onSubmit={({ text }) => {
              return sendMessage(text)
            }}
<<<<<<< HEAD
            className="rounded-2xl border border-[#1f2d4a] bg-[#101a30] transition-colors hover:border-[#2399B4] focus-within:border-[#2399B4] focus-within:ring-0"
=======
            className="rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 focus-within:from-blue-600 focus-within:to-blue-700 transition-all"
>>>>>>> origin/main
          >
            <PromptInputBody className="p-4">
              <PromptInputTextarea
                placeholder="Digite sua dúvida clínica..."
<<<<<<< HEAD
                className="resize-none bg-transparent text-sm text-[#E6EDF7] placeholder:text-slate-400/70"
=======
                className="text-sm text-white placeholder:text-blue-100 bg-transparent resize-none"
>>>>>>> origin/main
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-center justify-end px-4 pb-4 pt-2">
              <PromptInputSubmit
                status={status === "idle" ? undefined : status}
                disabled={!input.trim() && status === "idle"}
<<<<<<< HEAD
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0891b2] via-[#06b6d4] to-[#22d3ee] text-[#0B1627] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-3 text-center text-xs text-slate-400">
=======
                className="rounded-full h-9 w-9 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-blue-600">
>>>>>>> origin/main
            Pressione Enter para enviar, Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
