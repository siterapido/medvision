"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { ArtifactCreationHub } from "@/components/artifacts/artifact-creation-hub"
import {
    SummaryForm,
    ResearchForm,
    ExamForm,
    FlashcardsForm,
    MindMapForm
} from "@/components/artifacts/artifact-forms"
import { LaudoEditor } from "@/components/artifacts/laudo-editor"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Library, BookOpen, GraduationCap, WalletCards, BrainCircuit, Scan } from "lucide-react"
import { toast } from "sonner"

// Helper to get Label for type
const getLabelForType = (type: string) => {
    switch (type) {
        case "vision": return "Laudo Vision"
        case "research": return "Pesquisa Científica"
        case "exam": return "Simulado Prático"
        case "summary": return "Resumo de Estudo"
        case "flashcards": return "Flashcards"
        case "mindmap": return "Mapa Mental"
        default: return "Artefato"
    }
}

// Helper to get Icon for type
const getIconForType = (type: string) => {
    switch (type) {
        case "vision": return <Scan className="h-6 w-6" />
        case "research": return <BookOpen className="h-6 w-6" />
        case "exam": return <GraduationCap className="h-6 w-6" />
        case "summary": return <Library className="h-6 w-6" />
        case "flashcards": return <WalletCards className="h-6 w-6" />
        case "mindmap": return <BrainCircuit className="h-6 w-6" />
        default: return <Library className="h-6 w-6" />
    }
}

export default function StudioPage() {
    const router = useRouter()
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showGenerationOverlay, setShowGenerationOverlay] = useState(false)

    // Handler to go back to hub
    const handleBack = () => setSelectedType(null)

    // Handler to generate artifact
    const handleGenerate = async (type: string, data: Record<string, unknown>) => {
        setIsGenerating(true)
        setShowGenerationOverlay(true)

        try {
            const response = await fetch('/api/artifacts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, config: data })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha na geração')
            }

            const result = await response.json()

            toast.success("Artefato gerado com sucesso!", {
                description: `${getLabelForType(type)} criado e salvo na biblioteca.`
            })

            // Close overlay and redirect to biblioteca with highlight
            setShowGenerationOverlay(false)
            setIsGenerating(false)

            // Redirect to specific biblioteca section based on type
            const redirectMap: Record<string, string> = {
                summary: '/dashboard/biblioteca/resumo',
                research: '/dashboard/biblioteca/pesquisa',
                exam: '/dashboard/biblioteca/simulado',
                flashcards: '/dashboard/biblioteca/flashcards',
                mindmap: '/dashboard/biblioteca/mapas',
                vision: '/dashboard/biblioteca/laudos',
            }

            router.push(redirectMap[type] || `/dashboard/biblioteca?highlight=${result.artifact.id}`)

        } catch (error) {
            console.error('Generation error:', error)
            toast.error("Erro ao gerar artefato", {
                description: error instanceof Error ? error.message : "Tente novamente mais tarde."
            })
            setIsGenerating(false)
            setShowGenerationOverlay(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            <header className="mb-8 flex items-center gap-4">
                {selectedType && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="rounded-full hover:bg-white/10"
                        disabled={isGenerating}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="flex items-center gap-3">
                    {selectedType && (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            {getIconForType(selectedType)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold font-heading tracking-tight">
                            {selectedType ? getLabelForType(selectedType) : "Odonto Studio"}
                        </h1>
                        <p className="text-slate-400">
                            {selectedType
                                ? "Configure os detalhes para gerar seu artefato."
                                : "Central de criação de conhecimento assistida por IA."
                            }
                        </p>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {!selectedType ? (
                    <motion.div
                        key="hub"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ArtifactCreationHub onSelectType={setSelectedType} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Left Column: Form */}
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-fit">
                            {selectedType === "summary" && (
                                <SummaryForm
                                    isLoading={isGenerating}
                                    onSubmit={(data) => handleGenerate('summary', data)}
                                />
                            )}
                            {selectedType === "research" && (
                                <ResearchForm
                                    isLoading={isGenerating}
                                    onSubmit={(data) => handleGenerate('research', data)}
                                />
                            )}
                            {selectedType === "exam" && (
                                <ExamForm
                                    isLoading={isGenerating}
                                    onSubmit={(data) => handleGenerate('exam', data)}
                                />
                            )}
                            {selectedType === "flashcards" && (
                                <FlashcardsForm
                                    isLoading={isGenerating}
                                    onSubmit={(data) => handleGenerate('flashcards', data)}
                                />
                            )}
                            {selectedType === "mindmap" && (
                                <MindMapForm
                                    isLoading={isGenerating}
                                    onSubmit={(data) => handleGenerate('mindmap', data)}
                                />
                            )}
                            {selectedType === "vision" && (
                                <LaudoEditor
                                    isLoading={isGenerating}
                                    onSubmit={async (data, imageFile) => {
                                        // Convert image to base64
                                        let imageBase64 = ''
                                        if (imageFile) {
                                            const reader = new FileReader()
                                            imageBase64 = await new Promise((resolve) => {
                                                reader.onloadend = () => resolve(reader.result as string)
                                                reader.readAsDataURL(imageFile)
                                            })
                                        }
                                        handleGenerate('vision', { ...data, imageBase64 })
                                    }}
                                />
                            )}
                        </div>

                        {/* Right Column: Preview / Explainer */}
                        <div className="hidden lg:flex flex-col justify-center items-center text-center p-12 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                            <div className="max-w-md space-y-4">
                                <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                    <span className="text-3xl">✨</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Preview em Tempo Real</h3>
                                <p className="text-slate-400">
                                    Seu artefato aparecerá aqui após a geração. Você poderá editar, salvar e exportar para sua biblioteca.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generation Overlay */}
            <GenerationOverlay
                isOpen={showGenerationOverlay}
                onClose={() => {
                    if (!isGenerating) {
                        setShowGenerationOverlay(false)
                    }
                }}
                type={selectedType || ''}
                title={`Gerando ${getLabelForType(selectedType || '')}`}
            />
        </div>
    )
}
