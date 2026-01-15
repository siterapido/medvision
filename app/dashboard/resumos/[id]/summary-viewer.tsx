"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, BookOpen, BrainCircuit, Copy, Layers, RotateCw, Save, Share2, Sparkles, Monitor, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FlashcardDeck } from "../components/flashcard-deck"
import { MindMapViewer } from "../components/mind-map"

interface SummaryViewerProps {
    summary: any
    userId: string
    triggerGeneration: boolean
    initialFlashcards?: any[]
    initialMindMap?: any
}

export function SummaryViewer({ summary, userId, triggerGeneration, initialFlashcards = [], initialMindMap = null }: SummaryViewerProps) {
    const router = useRouter()
    const supabase = createClient()

    const [content, setContent] = React.useState(summary.content || "")
    const [flashcards, setFlashcards] = React.useState<any[]>(initialFlashcards)
    const [mindMap, setMindMap] = React.useState<any>(initialMindMap)

    const [status, setStatus] = React.useState(summary.status)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [activeTab, setActiveTab] = React.useState("text")
    const [readingMode, setReadingMode] = React.useState<"light" | "dark">("light")

    const hasTriggeredRef = React.useRef(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
        }
    }, [content, activeTab])

    const generateSummary = async () => {
        if (isGenerating) return
        setIsGenerating(true)
        setStatus("generating")
        setContent("")
        setProgress(10)

        try {
            const response = await fetch("/api/v1/resumos/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    summaryId: summary.id,
                    topics: summary.title.split(", "),
                    format: "SUMMARY",
                    complexity: summary.complexity_level || "medium"
                })
            })

            if (!response.ok) throw new Error("Generation failed")

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No stream reader")

            const decoder = new TextDecoder()
            let result = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const text = decoder.decode(value, { stream: true })
                result += text
                setContent((prev) => prev + text)
                setProgress((prev: number) => Math.min(prev + 1, 90))
            }

            setStatus("ready")
            setProgress(100)
            router.refresh()

        } catch (error) {
            console.error("Error:", error)
            setStatus("failed")
        } finally {
            setIsGenerating(false)
        }
    }

    const generateSpecificFormat = async (format: "FLASHCARDS" | "MINDMAP") => {
        if (isGenerating) return
        setIsGenerating(true)
        setProgress(10)

        if (format === "FLASHCARDS") setFlashcards([])
        if (format === "MINDMAP") setMindMap(null)

        try {
            const response = await fetch("/api/v1/resumos/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    summaryId: summary.id,
                    topics: summary.title.split(", "),
                    format: format,
                    complexity: summary.complexity_level || "medium"
                })
            })

            if (!response.ok) throw new Error("Generation failed")

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No stream reader")

            const decoder = new TextDecoder()
            let fullText = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const text = decoder.decode(value, { stream: true })
                fullText += text
                setProgress((prev: number) => Math.min(prev + 5, 90))
            }

            try {
                const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim()
                const data = JSON.parse(cleanJson)

                if (format === "FLASHCARDS") {
                    setFlashcards(data)
                } else {
                    setMindMap(data)
                }
            } catch (e) {
                console.error("Failed to parse generation result", e)
            }

            setProgress(100)
            router.refresh()

        } catch (error) {
            console.error("Error:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    React.useEffect(() => {
        if (triggerGeneration && !hasTriggeredRef.current && status === 'generating' && !summary.content) {
            hasTriggeredRef.current = true
            generateSummary()
        }
    }, [triggerGeneration, status, summary.content])

    const handleSave = async () => {
        try {
            await supabase
                .from("summaries")
                .update({ content, updated_at: new Date().toISOString() })
                .eq("id", summary.id)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div id="summary-content" className="container mx-auto p-4 lg:p-8 max-w-5xl space-y-6 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50" onClick={() => router.push("/dashboard/resumos")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold line-clamp-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {summary.title}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs font-medium rounded-md px-2 border-primary/20 bg-primary/5 text-primary">
                                {summary.complexity_level === 'advanced' ? 'Avançado' :
                                    summary.complexity_level === 'basic' ? 'Básico' : 'Intermédio'}
                            </Badge>
                            <span className="text-xs opacity-50">•</span>
                            <span className="text-xs font-mono opacity-70">{new Date(summary.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    {(status === 'generating' || isGenerating) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse border border-primary/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Gerando IA...</span>
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={handleSave} className="rounded-full shadow-sm hover:shadow-md transition-all">
                        <Save className="mr-2 h-4 w-4" /> Salvar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-full shadow-sm hover:shadow-md transition-all">
                        <Share2 className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {(status === 'generating' || isGenerating) && (
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <Tabs defaultValue="text" className="space-y-6" onValueChange={setActiveTab}>
                <div className="flex justify-between items-center">
                    <TabsList className="bg-muted/30 p-1 rounded-full border border-border/50 backdrop-blur-sm">
                        <TabsTrigger value="text" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BookOpen className="h-4 w-4 mr-2" /> Leitura
                        </TabsTrigger>
                        <TabsTrigger value="flashcards" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Layers className="h-4 w-4 mr-2" /> Flashcards
                        </TabsTrigger>
                        <TabsTrigger value="mindmap" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BrainCircuit className="h-4 w-4 mr-2" /> Mapa Mental
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'text' && (
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReadingMode("light")}
                                className={cn("h-7 w-7 rounded-full p-0", readingMode === "light" && "bg-white shadow-sm text-yellow-600")}
                            >
                                <Sun className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReadingMode("dark")}
                                className={cn("h-7 w-7 rounded-full p-0", readingMode === "dark" && "bg-slate-900 shadow-sm text-slate-100")}
                            >
                                <Moon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value="text" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className={cn(
                        "rounded-3xl p-8 md:p-12 min-h-[600px] shadow-sm transition-colors duration-300 border border-border/50",
                        readingMode === "light"
                            ? "bg-[#fafafa] text-slate-800"
                            : "bg-[#1a1b1e] text-slate-200"
                    )}>
                        {status === 'generating' && !content ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                                    <div className="relative bg-background p-4 rounded-2xl border border-primary/10 shadow-xl">
                                        <Sparkles className="h-8 w-8 text-primary animate-bounce duration-[3000ms]" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-center max-w-sm">
                                    <h3 className="font-semibold text-lg">Criando Material de Estudo</h3>
                                    <p className="text-muted-foreground text-sm">A IA está analisando o conteúdo para gerar um resumo otimizado para sua leitura.</p>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={cn(
                                    "w-full h-full font-serif text-lg leading-loose bg-transparent border-none resize-none focus:outline-none focus:ring-0 p-0 selection:bg-primary/20",
                                    readingMode === "light" ? "text-slate-800" : "text-slate-200"
                                )}
                                placeholder="O conteúdo aparecerá aqui..."
                                spellCheck={false}
                            />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="flashcards" className="focus-visible:outline-none focus-visible:ring-0">
                    <Card className="min-h-[500px] flex items-center justify-center p-8 bg-muted/5 border-dashed border-2">
                        {flashcards && flashcards.length > 0 ? (
                            <FlashcardDeck cards={flashcards} />
                        ) : (
                            <div className="text-center space-y-6 max-w-md">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Layers className="h-8 w-8 text-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">Memória Ativa</h3>
                                    <p className="text-muted-foreground">
                                        Transforme este resumo em flashcards interativos para testar seu conhecimento.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => generateSpecificFormat("FLASHCARDS")}
                                    disabled={isGenerating}
                                    className="rounded-full shadow-lg shadow-indigo-500/20"
                                >
                                    {isGenerating ? <><Sparkles className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Flashcards com IA</>}
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="mindmap" className="focus-visible:outline-none focus-visible:ring-0">
                    <Card className="min-h-[500px] flex items-center justify-center p-8 bg-muted/5 border-dashed border-2">
                        {mindMap ? (
                            <MindMapViewer data={mindMap} />
                        ) : (
                            <div className="text-center space-y-6 max-w-md">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                                    <BrainCircuit className="h-8 w-8 text-pink-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">Visualização Estruturada</h3>
                                    <p className="text-muted-foreground">
                                        Crie um mapa mental automático para visualizar as conexões entre os tópicos.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => generateSpecificFormat("MINDMAP")}
                                    disabled={isGenerating}
                                    className="rounded-full shadow-lg shadow-pink-500/20"
                                >
                                    {isGenerating ? <><Sparkles className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Mapa Mental com IA</>}
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
