"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, BookOpen, BrainCircuit, Copy, Layers, RotateCw, Save, Share2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
// import { useToast } from "@/components/ui/use-toast"
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
    // const { toast } = useToast()

    const [content, setContent] = React.useState(summary.content || "")
    const [flashcards, setFlashcards] = React.useState<any[]>(initialFlashcards)
    const [mindMap, setMindMap] = React.useState<any>(initialMindMap)

    const [status, setStatus] = React.useState(summary.status)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [progress, setProgress] = React.useState(0)

    // Track active tab to know what to generate if triggered differently
    const [activeTab, setActiveTab] = React.useState("text")

    // Ref to avoid double effect execution
    const hasTriggeredRef = React.useRef(false)

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

            // Force refresh to ensure server data is consistent if needed
            router.refresh()

        } catch (error) {
            console.error("Error:", error)
            setStatus("failed")
            // toast({ title: "Erro na geração", variant: "destructive" })
        } finally {
            setIsGenerating(false)
        }
    }

    const generateSpecificFormat = async (format: "FLASHCARDS" | "MINDMAP") => {
        if (isGenerating) return
        setIsGenerating(true)
        setProgress(10)

        // Reset state for the specific format
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
                // We don't update state directly with chunks for JSON data as it might be invalid JSON until finish
                // But we could show raw progress if we wanted.
                setProgress((prev: number) => Math.min(prev + 5, 90))
            }

            // Parse and set data
            try {
                // Clean markdown if present
                const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim()
                const data = JSON.parse(cleanJson)

                if (format === "FLASHCARDS") {
                    setFlashcards(data)
                } else {
                    setMindMap(data)
                }
            } catch (e) {
                console.error("Failed to parse generation result", e)
                // Fallback or error state
            }

            setProgress(100)
            router.refresh()

        } catch (error) {
            console.error("Error:", error)
            // toast({ title: "Erro na geração", variant: "destructive" })
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

            // toast({ title: "Salvo com sucesso" })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div id="summary-content" className="container mx-auto p-4 lg:p-8 max-w-5xl space-y-6">
            <div className="flex items-center justify-between mb-4 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/resumos")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold line-clamp-1">{summary.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                                {summary.complexity_level === 'advanced' ? 'Avançado' : 'Médio'}
                            </Badge>
                            <span>•</span>
                            <span>{new Date(summary.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    {status === 'generating' && <Badge className="animate-pulse">Gerando...</Badge>}
                    <Button variant="outline" size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Salvar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Share2 className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {status === 'generating' || isGenerating && (
                <Progress value={progress} className="w-full h-1" />
            )}

            <Tabs defaultValue="text" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Texto
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Flashcards
                    </TabsTrigger>
                    <TabsTrigger value="mindmap" className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4" /> Mapa Mental
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                    <Card className="min-h-[500px] p-6">
                        {status === 'generating' && !content ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-muted-foreground">Sua IA está escrevendo o resumo...</p>
                            </div>
                        ) : (
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[600px] font-sans text-base leading-relaxed border-none resize-none focus-visible:ring-0 p-0"
                                placeholder="O conteúdo aparecerá aqui..."
                            />
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="flashcards">
                    <Card className="min-h-[400px] flex items-center justify-center p-6 bg-muted/5">
                        {flashcards && flashcards.length > 0 ? (
                            <FlashcardDeck cards={flashcards} />
                        ) : (
                            <div className="text-center space-y-4">
                                <Layers className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <h3 className="text-lg font-medium">Flashcards ainda não gerados</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Gere flashcards a partir do resumo para praticar active recall.
                                </p>
                                <Button onClick={() => generateSpecificFormat("FLASHCARDS")} disabled={isGenerating}>
                                    {isGenerating ? "Gerando..." : "Gerar Flashcards"}
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="mindmap">
                    <Card className="min-h-[400px] flex items-center justify-center p-6 bg-muted/5">
                        {mindMap ? (
                            <MindMapViewer data={mindMap} />
                        ) : (
                            <div className="text-center space-y-4">
                                <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <h3 className="text-lg font-medium">Mapa Mental ainda não gerado</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Visualize os conceitos de forma estruturada.
                                </p>
                                <Button onClick={() => generateSpecificFormat("MINDMAP")} disabled={isGenerating}>
                                    {isGenerating ? "Gerando..." : "Gerar Mapa Mental"}
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
