"use client"

import { Bot, User, Copy, CheckCheck, AlertCircle, Loader2, FileText, BrainCircuit, Microscope, LayoutGrid, Network } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import type { ChatMessage } from "@/lib/agno"
import { getAgentInfo } from "@/lib/agent-config"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "./markdown-components"

interface AgnoMessageProps {
    message: ChatMessage
}

export function AgnoMessage({ message }: AgnoMessageProps) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === "user"
    const hasError = message.streamingError

    // Get agent info for styling
    const agent = getAgentInfo(message.agent_id)
    const AgentIcon = agent.icon

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
                <div className="flex flex-col items-center gap-1">
                    <div
                        key={agent.id}
                        className={cn(
                            "relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                            "transition-all duration-700 ease-elastic-out", // Transição suave
                            "zoom-in-elastic", // Animação customizada
                            `bg-gradient-to-br ${agent.gradient}`
                        )}>
                        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping-once" /> {/* Efeito de invocação */}
                        <AgentIcon className="w-5 h-5 text-white relative z-10" />

                        {/* Animated ring */}
                        {message.isStreaming && (
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
                        )}
                    </div>

                    {/* Agent name label */}
                    <span className="text-[9px] text-slate-500 font-medium truncate max-w-[60px] text-center">
                        {agent.name}
                    </span>
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

                    {/* Content Rendering */}
                    {!message.content && message.isStreaming ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span className="text-slate-400">Pensando...</span>
                        </div>
                    ) : (
                        <div className="text-sm leading-relaxed text-slate-300">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}

                    {/* Tool calls indicator - Generative UI */}
                    {message.tool_calls && message.tool_calls.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.tool_calls.map((tool, idx) => {
                                const isResearch = tool.tool_name === "save_research"
                                const isExam = tool.tool_name === "save_practice_exam"
                                const isSummary = tool.tool_name === "save_summary"
                                const isFlashcards = tool.tool_name === "save_flashcards"
                                const isMindMap = tool.tool_name === "save_mind_map"
                                const isLoading = tool.result === undefined

                                let researchId = ""
                                let researchTitle = "Pesquisa Científica"

                                if (!isLoading && tool.result) {
                                    try {
                                        // Tenta fazer parse do JSON retornado pela ferramenta
                                        const resultJson = JSON.parse(tool.result)
                                        if (resultJson.artifact) {
                                            researchId = resultJson.artifact.id
                                            researchTitle = resultJson.artifact.title || researchTitle
                                        }
                                    } catch (e) {
                                        // Fallback para Regex antigo se não for JSON válido
                                        const match = tool.result.match(/ID:\s*([a-f0-9\-]+)/)
                                        if (match) researchId = match[1]
                                    }
                                }

                                if (isResearch) {
                                    return (
                                        <div key={idx} className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/5 group/tool">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 transition-transform group-hover/tool:scale-110 shrink-0">
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                                                    ) : (
                                                        <Microscope className="w-5 h-5 text-emerald-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0 mr-2">
                                                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest truncate">
                                                        {isLoading ? "Processando Pesquisa..." : researchTitle}
                                                    </span>
                                                    {!isLoading && (
                                                        <span className="text-[10px] text-emerald-400/70 font-medium truncate">
                                                            Salvo com evidências
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isLoading && researchId && (
                                                <Link
                                                    href={`/dashboard/pesquisas/${researchId}`}
                                                    className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                                                >
                                                    Abrir
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }

                                if (isExam) {
                                    return (
                                        <div key={idx} className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-xl flex items-center justify-between shadow-lg shadow-violet-500/5 group/tool">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20 transition-transform group-hover/tool:scale-110">
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                                                    ) : (
                                                        <BrainCircuit className="w-5 h-5 text-violet-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-violet-100 uppercase tracking-widest">
                                                        {isLoading ? "Configurando Simulado..." : "Simulado Acadêmico"}
                                                    </span>
                                                    {!isLoading && (
                                                        <span className="text-[10px] text-violet-400/70 font-medium">Pronto para praticar</span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isLoading && (
                                                <Link
                                                    href={tool.result?.match(/ID:\s*([a-f0-9\-]+)/)?.[1] ? `/dashboard/questionarios/${tool.result.match(/ID:\s*([a-f0-9\-]+)/)![1]}` : "/dashboard/questionarios"}
                                                    className="px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    Iniciar
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }

                                if (isFlashcards) {
                                    return (
                                        <div key={idx} className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl flex items-center justify-between shadow-lg shadow-orange-500/5 group/tool">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 transition-transform group-hover/tool:scale-110">
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                                    ) : (
                                                        <LayoutGrid className="w-5 h-5 text-orange-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-orange-100 uppercase tracking-widest">
                                                        {isLoading ? "Gerando Cartas..." : "Flashcards de Memorização"}
                                                    </span>
                                                    {!isLoading && (
                                                        <span className="text-[10px] text-orange-400/70 font-medium">Revisão ativa pronta</span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isLoading && (
                                                <Link
                                                    href={tool.result?.match(/ID:\s*([a-f0-9\-]+)/)?.[1] ? `/dashboard/flashcards/${tool.result.match(/ID:\s*([a-f0-9\-]+)/)![1]}` : "/dashboard/flashcards"}
                                                    className="px-4 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    Estudar
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }

                                if (isMindMap) {
                                    return (
                                        <div key={idx} className="p-4 bg-gradient-to-br from-pink-500/10 to-purple-600/5 border border-pink-500/20 rounded-xl flex items-center justify-between shadow-lg shadow-pink-500/5 group/tool">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/20 transition-transform group-hover/tool:scale-110">
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                                                    ) : (
                                                        <Network className="w-5 h-5 text-pink-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-pink-100 uppercase tracking-widest">
                                                        {isLoading ? "Mapeando Conceitos..." : "Mapa Mental"}
                                                    </span>
                                                    {!isLoading && (
                                                        <span className="text-[10px] text-pink-400/70 font-medium">Visualização hierárquica</span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isLoading && (
                                                <Link
                                                    href={tool.result?.match(/ID:\s*([a-f0-9\-]+)/)?.[1] ? `/dashboard/mindmaps/${tool.result.match(/ID:\s*([a-f0-9\-]+)/)![1]}` : "/dashboard/mindmaps"}
                                                    className="px-4 py-1.5 text-xs bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold shadow-lg shadow-pink-600/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    Ver Mapa
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }

                                if (isSummary) {
                                    return (
                                        <div key={idx} className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl flex items-center justify-between shadow-lg shadow-blue-500/5 group/tool">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 transition-transform group-hover/tool:scale-110">
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                                    ) : (
                                                        <FileText className="w-5 h-5 text-blue-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                                                        {isLoading ? "Redigindo Resumo..." : "Resumo de Estudo"}
                                                    </span>
                                                    {!isLoading && (
                                                        <span className="text-[10px] text-blue-400/70 font-medium">Conteúdo acadêmico disponível</span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isLoading && (
                                                <Link
                                                    href={tool.result?.match(/ID:\s*([a-f0-9\-]+)/)?.[1] ? `/dashboard/resumos/${tool.result.match(/ID:\s*([a-f0-9\-]+)/)![1]}` : "/dashboard/resumos"}
                                                    className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                                                >
                                                    Ler
                                                </Link>
                                            )}
                                        </div>
                                    )
                                }

                                // Generic Tool
                                return (
                                    <div key={idx} className="p-2 bg-slate-800/30 rounded border border-slate-700/30 text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isLoading ? (
                                                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                            ) : (
                                                <span className="text-green-400">✓</span>
                                            )}
                                            <span className="font-mono text-slate-400">{tool.tool_name}</span>
                                        </div>
                                        {!isLoading && tool.result && (
                                            <div className="pl-5 text-slate-500 font-mono truncate max-w-[200px]" title={tool.result}>
                                                → {tool.result.slice(0, 50)}...
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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
