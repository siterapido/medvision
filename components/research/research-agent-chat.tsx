"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "@/components/agno-chat/markdown-components"
import { toast } from "sonner"
import {
    Search,
    Loader2,
    FileText,
    CheckCircle2,
    Microscope,
    BookOpen,
    Send,
    Sparkles,
    Copy,
    Save,
    CheckCheck
} from "lucide-react"

// Estado tipado do agente de pesquisa
interface ResearchState {
    status: "idle" | "searching" | "analyzing" | "synthesizing" | "saving" | "completed" | "error"
    query: string
    sources: Array<{ title: string; url: string; pmid?: string; type?: string }>
    summary: string
    progress: number
    error?: string
}

interface ResearchAgentChatProps {
    userId: string
    onComplete?: (researchId: string) => void
}

export function ResearchAgentChat({ userId, onComplete }: ResearchAgentChatProps) {
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [researchState, setResearchState] = useState<ResearchState>({
        status: "idle",
        query: "",
        sources: [],
        summary: "",
        progress: 0
    })

    // Expose context to AI
    useCopilotReadable({
        description: "Contexto atual da pesquisa científica",
        value: {
            userId,
            currentQuery: researchState.query,
            sourcesFound: researchState.sources.length,
            status: researchState.status
        }
    })

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, researchState])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isStreaming) return

        const userMessage = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMessage }])
        setIsStreaming(true)
        setResearchState(prev => ({
            ...prev,
            status: "searching",
            query: userMessage,
            progress: 10
        }))

        try {
            const agnoServiceUrl = process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://127.0.0.1:8000"
            const baseUrl = agnoServiceUrl.replace(/\/$/, "")

            // Request to research agent
            const response = await fetch(`${baseUrl}/api/v1/agentes/dr-ciencia/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    userId: userId,
                    context: {
                        page: "pesquisas",
                        action: "create_research"
                    }
                })
            })

            if (!response.ok) {
                throw new Error("Falha na comunicação com o agente")
            }

            // Process streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ""
            let foundSources: Array<{ title: string; url: string }> = []

            setResearchState(prev => ({ ...prev, status: "analyzing", progress: 30 }))

            while (reader) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n").filter(Boolean)

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line)

                        // Handle different event types
                        if (data.type === "text" || data.content) {
                            assistantMessage += data.content || data.text || ""
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMsg = newMessages[newMessages.length - 1]
                                if (lastMsg?.role === "assistant") {
                                    lastMsg.content = assistantMessage
                                } else {
                                    newMessages.push({ role: "assistant", content: assistantMessage })
                                }
                                return newMessages
                            })
                        }

                        // Extract sources from content
                        if (data.content && data.content.includes("PMID:")) {
                            const pmidMatch = data.content.match(/PMID:\s*(\d+)/g)
                            if (pmidMatch) {
                                pmidMatch.forEach((match: string) => {
                                    const pmid = match.replace("PMID:", "").trim()
                                    if (!foundSources.find(s => s.url.includes(pmid))) {
                                        foundSources.push({
                                            title: `PubMed Article ${pmid}`,
                                            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
                                        })
                                    }
                                })
                                setResearchState(prev => ({
                                    ...prev,
                                    sources: foundSources,
                                    progress: Math.min(prev.progress + 10, 70)
                                }))
                            }
                        }

                        // Handle tool calls (save_research)
                        if (data.tool_name === "save_research" || data.type === "tool_result") {
                            setResearchState(prev => ({ ...prev, status: "saving", progress: 90 }))

                            // Parse result if it contains success info
                            if (data.result && typeof data.result === "string") {
                                try {
                                    const result = JSON.parse(data.result)
                                    if (result.success && result.artifact?.id) {
                                        setResearchState(prev => ({ ...prev, status: "completed", progress: 100 }))
                                        onComplete?.(result.artifact.id)
                                    }
                                } catch {
                                    // Result might be a simple string
                                    if (data.result.includes("sucesso")) {
                                        setResearchState(prev => ({ ...prev, status: "completed", progress: 100 }))
                                    }
                                }
                            }
                        }

                    } catch {
                        // Line might not be JSON, continue
                    }
                }
            }

            // If we finished but didn't detect completion, mark as synthesizing
            if (researchState.status !== "completed") {
                setResearchState(prev => ({
                    ...prev,
                    status: "synthesizing",
                    progress: 80,
                    summary: assistantMessage.substring(0, 200)
                }))
            }

        } catch (error) {
            console.error("Research error:", error)
            setResearchState(prev => ({
                ...prev,
                status: "error",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            }))
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Desculpe, ocorreu um erro ao processar sua pesquisa. Tente novamente."
            }])
        } finally {
            setIsStreaming(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleManualSave = async (content: string) => {
        if (researchState.status === "completed" || researchState.status === "saving") return

        setResearchState(prev => ({ ...prev, status: "saving" }))

        try {
            const response = await fetch("/api/research/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    query: researchState.query || messages[0]?.content || "Pesquisa sem título", // Fallback for query
                    content,
                    sources: researchState.sources,
                    type: "research"
                })
            })

            if (!response.ok) {
                throw new Error("Falha ao salvar pesquisa")
            }

            const data = await response.json()

            setResearchState(prev => ({ ...prev, status: "completed" }))
            toast.success("Pesquisa salva com sucesso!")

            if (data.id) {
                onComplete?.(data.id)
                router.refresh()
            }

        } catch (error) {
            console.error("Erro ao salvar:", error)
            toast.error("Erro ao salvar pesquisa")
            setResearchState(prev => ({ ...prev, status: "synthesizing" }))
        }
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Microscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Odonto Research
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                        </h2>
                        <p className="text-xs text-slate-400">Pesquisador científico especializado</p>
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            {researchState.status !== "idle" && researchState.status !== "completed" && (
                <ResearchProgress state={researchState} />
            )}

            {/* Messages */}
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                    )}
                >
                    <div className={cn("max-w-[85%]", message.role === "user" ? "" : "w-full")}>
                        {message.role === "user" ? (
                            <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                    {message.content}
                                </div>
                            </div>
                        ) : (
                            <Card className="bg-slate-900/40 border-slate-700/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <CardHeader className="pb-2 border-b border-slate-700/50 bg-slate-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                                            <Microscope className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                Odonto Research
                                                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] h-5">
                                                    Pesquisador
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="text-slate-400 text-xs">
                                                Referência Científica baseada em evidências
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 text-slate-300 text-sm leading-relaxed space-y-4">
                                    {message.content ? (
                                        <MarkdownRenderer
                                            remarkPlugins={[remarkGfm]}
                                            components={MarkdownComponents}
                                        >
                                            {message.content}
                                        </MarkdownRenderer>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 italic">
                                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                            Analisando bases de dados científicas...
                                        </div>
                                    )}
                                </CardContent>
                                {message.content && !isStreaming && (
                                    <CardFooter className="bg-slate-900/30 border-t border-slate-700/50 py-3 flex justify-between items-center gap-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(message.content)
                                                    toast.success("Conteúdo copiado!")
                                                }}
                                            >
                                                <Copy className="w-3 h-3 mr-1.5" />
                                                Copiar
                                            </Button>
                                        </div>

                                        {/* Botão de Salvar solicitado */}
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
                                            onClick={() => handleManualSave(message.content)}
                                            disabled={researchState.status === "saving" || researchState.status === "completed"}
                                        >
                                            {researchState.status === "completed" ? (
                                                <>
                                                    <CheckCheck className="w-3 h-3 mr-1.5" />
                                                    Salvo
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-3 h-3 mr-1.5" />
                                                    Salvar Pesquisa
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            ))}

            <div ref={messagesEndRef} />
        </div>

            {/* Completed State */ }
    {
        researchState.status === "completed" && (
            <div className="flex-shrink-0 p-4 border-t border-slate-800/50 bg-green-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">
                            Pesquisa salva com sucesso!
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => router.refresh()}
                    >
                        Ver Pesquisas
                    </Button>
                </div>
            </div>
        )
    }

    {/* Input Area */ }
    <div className="flex-shrink-0 p-4 border-t border-slate-800/50 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta de pesquisa..."
                className="flex-1 min-h-[44px] max-h-32 resize-none bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 text-white placeholder-slate-500"
                disabled={isStreaming}
            />
            <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isStreaming}
                className="h-11 w-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
            >
                {isStreaming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-5 h-5" />
                )}
            </Button>
        </form>
    </div>
        </div >
    )
}

// Sub-component for progress display
function ResearchProgress({ state }: { state: ResearchState }) {
    const statusConfig = {
        idle: { label: "Pronto", icon: Search, color: "slate" },
        searching: { label: "Buscando fontes...", icon: Search, color: "cyan" },
        analyzing: { label: "Analisando literatura...", icon: FileText, color: "blue" },
        synthesizing: { label: "Sintetizando resultados...", icon: BookOpen, color: "indigo" },
        saving: { label: "Salvando pesquisa...", icon: Loader2, color: "purple" },
        completed: { label: "Concluído!", icon: CheckCircle2, color: "green" },
        error: { label: "Erro", icon: Search, color: "red" }
    }

    const config = statusConfig[state.status]
    const Icon = config.icon

    return (
        <div className={`flex-shrink-0 mx-4 mt-4 bg-${config.color}-500/10 border border-${config.color}-500/20 rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-${config.color}-500/20 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${config.color}-400 ${state.status === "saving" ? "animate-spin" : ""}`} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{config.label}</p>
                    {state.query && (
                        <p className="text-xs text-slate-400 truncate">"{state.query}"</p>
                    )}
                </div>
                <span className="text-xs text-slate-500">{state.progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r from-${config.color}-500 to-${config.color}-400 transition-all duration-500 ease-out`}
                    style={{ width: `${state.progress}%` }}
                />
            </div>

            {/* Sources found */}
            {state.sources.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <FileText className="w-3 h-3" />
                    <span>{state.sources.length} fontes encontradas</span>
                </div>
            )}
        </div>
    )
}
