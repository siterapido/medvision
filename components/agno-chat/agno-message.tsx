"use client"

import { Bot, User, Copy, CheckCheck, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import type { ChatMessage } from "@/lib/agno"

interface AgnoMessageProps {
    message: ChatMessage
}

export function AgnoMessage({ message }: AgnoMessageProps) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === "user"
    const hasError = message.streamingError

    const copyContent = async () => {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Simple markdown-like rendering
    const renderContent = (content: string) => {
        if (!content) {
            return message.isStreaming ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-slate-400">Pensando...</span>
                </div>
            ) : null
        }

        // Split content by code blocks
        const parts = content.split(/(```[\s\S]*?```)/g)

        return parts.map((part, index) => {
            if (part.startsWith("```")) {
                // Code block
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/)
                if (match) {
                    const [, lang, code] = match
                    return (
                        <pre
                            key={index}
                            className="my-2 p-3 rounded-lg bg-black/30 overflow-x-auto text-xs"
                        >
                            {lang && (
                                <div className="text-xs text-slate-500 mb-2">{lang}</div>
                            )}
                            <code className="text-slate-300">{code.trim()}</code>
                        </pre>
                    )
                }
            }

            // Regular text - split by lines and handle basic formatting
            return part.split("\n").map((line, lineIndex) => {
                // Headers
                if (line.startsWith("### ")) {
                    return (
                        <h3 key={`${index}-${lineIndex}`} className="text-base font-semibold mt-3 mb-1">
                            {line.slice(4)}
                        </h3>
                    )
                }
                if (line.startsWith("## ")) {
                    return (
                        <h2 key={`${index}-${lineIndex}`} className="text-lg font-semibold mt-4 mb-2">
                            {line.slice(3)}
                        </h2>
                    )
                }
                if (line.startsWith("# ")) {
                    return (
                        <h1 key={`${index}-${lineIndex}`} className="text-xl font-bold mt-4 mb-2">
                            {line.slice(2)}
                        </h1>
                    )
                }

                // Lists
                if (line.match(/^[-*]\s/)) {
                    return (
                        <li key={`${index}-${lineIndex}`} className="ml-4 list-disc">
                            {formatInlineText(line.slice(2))}
                        </li>
                    )
                }
                if (line.match(/^\d+\.\s/)) {
                    return (
                        <li key={`${index}-${lineIndex}`} className="ml-4 list-decimal">
                            {formatInlineText(line.replace(/^\d+\.\s/, ""))}
                        </li>
                    )
                }

                // Empty line = paragraph break
                if (!line.trim()) {
                    return <br key={`${index}-${lineIndex}`} />
                }

                // Regular paragraph
                return (
                    <p key={`${index}-${lineIndex}`} className="mb-1">
                        {formatInlineText(line)}
                    </p>
                )
            })
        })
    }

    // Format inline text (bold, italic, code)
    const formatInlineText = (text: string) => {
        // Handle inline code
        const parts = text.split(/(`[^`]+`)/g)
        return parts.map((part, i) => {
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-black/30 text-cyan-300 text-xs"
                    >
                        {part.slice(1, -1)}
                    </code>
                )
            }

            // Handle bold
            const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
            return boldParts.map((boldPart, j) => {
                if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
                    return (
                        <strong key={`${i}-${j}`} className="font-semibold">
                            {boldPart.slice(2, -2)}
                        </strong>
                    )
                }
                return <span key={`${i}-${j}`}>{boldPart}</span>
            })
        })
    }

    return (
        <div
            className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            )}

            <div
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}
            >
                <div
                    className={`rounded-2xl px-5 py-3 ${isUser
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white"
                        : hasError
                            ? "bg-red-900/30 border border-red-500/30 text-red-200"
                            : "bg-slate-800/80 border border-slate-700/50 text-slate-100"
                        } ${message.isStreaming ? "animate-pulse" : ""}`}
                >
                    {hasError && (
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">Erro na resposta</span>
                        </div>
                    )}

                    {/* Images */}
                    {message.images && message.images.length > 0 && (
                        <div className="mb-3">
                            {message.images.map((img, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden border border-white/20">
                                    <img
                                        src={img}
                                        alt="Uploaded Image"
                                        className="max-w-full h-auto max-h-[300px] object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                        {renderContent(message.content)}
                    </div>

                    {/* Tool calls indicator */}
                    {message.tool_calls && message.tool_calls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-600/50">
                            <p className="text-xs text-slate-400">
                                🔧 {message.tool_calls.length} ferramenta(s) utilizada(s)
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions for agent messages */}
                {!isUser && !message.isStreaming && message.content && (
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={copyContent}
                            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                            title="Copiar"
                        >
                            {copied ? (
                                <CheckCheck className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-300" />
                </div>
            )}
        </div>
    )
}
