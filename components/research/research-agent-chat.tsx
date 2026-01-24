"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "@/components/ui/markdown-components"
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

interface ResearchAgentChatProps {
    userId: string
    onComplete?: (researchId: string) => void
}

export function ResearchAgentChat({ userId, onComplete }: ResearchAgentChatProps) {
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
        api: "/api/newchat",
        body: {
            agentId: "odonto-research"
        }
    })

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as any)
        }
    }

    const handleManualSave = async (content: string) => {
        if (isSaving || isSaved) return

        setIsSaving(true)

        try {
            // Extract sources from content (basic regex for PMIDs and links)
            const sources: Array<{ title: string; url: string }> = []

            // Extract PMIDs
            const pmidMatch = content.match(/PMID:\s*(\d+)/g)
            if (pmidMatch) {
                pmidMatch.forEach((match: string) => {
                    const pmid = match.replace("PMID:", "").trim()
                    if (!sources.find(s => s.url.includes(pmid))) {
                        sources.push({
                            title: `PubMed Article ${pmid}`,
                            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
                        })
                    }
                })
            }

            // Extract Markdown links
            const linkMatch = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)
            if (linkMatch) {
                linkMatch.forEach((match) => {
                    const parts = match.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/)
                    if (parts && parts[1] && parts[2]) {
                        sources.push({
                            title: parts[1],
                            url: parts[2]
                        })
                    }
                })
            }

            const userQuery = messages.find(m => m.role === "user")?.content || "Pesquisa sem título"

            const response = await fetch("/api/research/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    query: userQuery,
                    content,
                    sources,
                    type: "research"
                })
            })

            if (!response.ok) {
                throw new Error("Falha ao salvar pesquisa")
            }

            const data = await response.json()

            setIsSaved(true)
            toast.success("Pesquisa salva com sucesso!")

            if (data.id) {
                onComplete?.(data.id)
                router.refresh()
            }

        } catch (error) {
            console.error("Erro ao salvar:", error)
            toast.error("Erro ao salvar pesquisa")
        } finally {
            setIsSaving(false)
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Welcome state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-cyan-500/20">
                            <Microscope className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Pesquisa Científica</h3>
                        <p className="text-sm text-slate-400 max-w-md mb-6">
                            Faça perguntas sobre odontologia e receba respostas baseadas em evidências científicas.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {[
                                "Quais os benefícios do flúor na prevenção de cáries?",
                                "Tratamento de periodontite avançada",
                                "Técnicas modernas de clareamento dental"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    className="px-3 py-2 text-xs text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
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
                                    {message.content && !isLoading && (
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

                                            <Button
                                                size="sm"
                                                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
                                                onClick={() => handleManualSave(message.content)}
                                                disabled={isSaving || isSaved}
                                            >
                                                {isSaved ? (
                                                    <>
                                                        <CheckCheck className="w-3 h-3 mr-1.5" />
                                                        Salvo
                                                    </>
                                                ) : isSaving ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                        Salvando...
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

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-700/50 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span className="text-sm text-slate-400">Pesquisando...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Completed State */}
            {isSaved && (
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
                            onClick={() => router.push("/dashboard/pesquisas")}
                        >
                            Ver Pesquisas
                        </Button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-slate-800/50 bg-slate-900/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua pergunta de pesquisa..."
                        className="flex-1 min-h-[44px] max-h-32 resize-none bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 text-white placeholder-slate-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="h-11 w-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
