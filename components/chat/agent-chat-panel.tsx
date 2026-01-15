"use client"

import { useRef, useEffect } from "react"
import { Loader2, Send, Sparkles, RefreshCw, ExternalLink } from "lucide-react"
import { useAgentChat } from "@/lib/hooks/useAgentChat"
import { getAgentInfo } from "@/lib/agent-config"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AgentChatPanelProps } from "./types"
import { useState } from "react"

/**
 * Componente de chat reutilizável para agentes Agno
 * Segue o design system existente com glassmorphism e gradientes
 */
export function AgentChatPanel({
    agentId,
    userId,
    title,
    subtitle,
    placeholder,
    suggestions = [],
    onArtifactCreated,
    className,
    compact = false
}: AgentChatPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState("")

    const { messages, state, sendMessage, clearMessages, isStreaming } = useAgentChat({
        agentId,
        userId,
        onArtifactCreated
    })

    const agentInfo = getAgentInfo(agentId)
    const AgentIcon = agentInfo.icon

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, state])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isStreaming) return
        const message = input.trim()
        setInput("")
        await sendMessage(message)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion)
    }

    return (
        <div className={cn(
            "flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-l border-slate-800/50",
            className
        )}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg",
                            `bg-gradient-to-br ${agentInfo.gradient} ${agentInfo.bgGlow}`
                        )}>
                            <AgentIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1">
                                {title || agentInfo.name}
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                            </h3>
                            {!compact && (
                                <p className="text-[10px] text-slate-400 truncate">
                                    {subtitle || agentInfo.description.slice(0, 50) + "..."}
                                </p>
                            )}
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={clearMessages}
                            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Nova conversa"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                {/* Progress indicator */}
                {isStreaming && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{state.currentAction || "Processando..."}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 ease-out rounded-full",
                                    `bg-gradient-to-r ${agentInfo.gradient}`
                                )}
                                style={{ width: `${state.progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {/* Welcome state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-2">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                            `bg-gradient-to-br ${agentInfo.gradient} opacity-20`
                        )}>
                            <AgentIcon className={`w-6 h-6 text-${agentInfo.color}-400`} />
                        </div>
                        <p className="text-sm text-slate-400 mb-4 max-w-[200px]">
                            {placeholder || `Pergunte algo para ${agentInfo.name}`}
                        </p>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="space-y-2 w-full">
                                {suggestions.slice(0, compact ? 2 : 4).map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full p-2 text-left text-xs text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all truncate"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Message list */}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[90%] rounded-xl px-3 py-2",
                                message.role === "user"
                                    ? `bg-gradient-to-r ${agentInfo.gradient} text-white`
                                    : "bg-slate-800/80 text-slate-100 border border-slate-700/50"
                            )}
                        >
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">
                                {message.content}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Streaming indicator */}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/50">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        </div>
                    </div>
                )}

                {/* Artifact created toast */}
                {state.artifact && (
                    <div className="flex justify-center">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                            <span className="text-xs text-green-400">✓ {state.artifact.title}</span>
                            <a
                                href={`/dashboard/${state.artifact.type === "research" ? "pesquisas" : "resumos"}/${state.artifact.id}`}
                                className="text-green-400 hover:text-green-300"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-slate-800/50 bg-slate-900/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Digite sua pergunta..."}
                        className="flex-1 min-h-[36px] max-h-20 resize-none bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 text-white placeholder-slate-500 text-xs"
                        disabled={isStreaming}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isStreaming}
                        className={cn(
                            "h-9 w-9 rounded-lg disabled:opacity-50",
                            `bg-gradient-to-r ${agentInfo.gradient} hover:opacity-90`
                        )}
                    >
                        {isStreaming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}

export { type AgentChatPanelProps } from "./types"
