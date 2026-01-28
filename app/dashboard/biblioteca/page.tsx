"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
    BookOpen,
    GraduationCap,
    Library,
    WalletCards,
    Scan,
    BrainCircuit,
    Image as ImageIcon,
    LayoutDashboard,
    ArrowRight
} from "lucide-react"
import { ArtifactCreationHub } from "@/components/artifacts/artifact-creation-hub"
// Note: We need to make sure ArtifactCreationHub handles the dialogs internally or lifts state.
// Assuming ArtifactCreationHub handles the dialogs as implemented previously in page.tsx.
// Actually, in the previous page.tsx, the state was in the page. 
// We should probably port those dialogs here or Refactor ArtifactCreationHub to be self-contained. 
// For now, I will reimplement the necessary state here for the Hub to work.

import { GenerationOverlay } from "@/components/artifacts/generation-overlay"
import { SummaryForm, ResearchForm, ExamForm, FlashcardsForm, MindMapForm } from "@/components/artifacts/artifact-forms"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CategoryCard } from "@/components/biblioteca/category-card"
import { ArtifactList } from "@/components/biblioteca/artifact-list"

// Helper to get Label/Icon for Creation Dialog (reused)
const getLabelForType = (type: string) => {
    switch (type) {
        case "chat": return "Conversa"
        case "document": return "Documento"
        case "code": return "Código"
        case "image": return "Imagem"
        case "vision": return "Laudo Vision"
        case "research": return "Pesquisa"
        case "exam": return "Simulado"
        case "summary": return "Resumo"
        case "flashcards": return "Flashcards"
        case "mindmap": return "Mapa Mental"
        default: return "Artefato"
    }
}
const getIconForType = (type: string) => {
    switch (type) {
        case "vision": return <Scan className="h-5 w-5" />
        case "research": return <BookOpen className="h-5 w-5" />
        case "exam": return <GraduationCap className="h-5 w-5" />
        case "summary": return <Library className="h-5 w-5" />
        case "flashcards": return <WalletCards className="h-5 w-5" />
        case "mindmap": return <BrainCircuit className="h-5 w-5" />
        default: return <Sparkles className="h-5 w-5" />
    }
}

export default function BibliotecaHub() {
    // Creation State
    const [creationDialogOpen, setCreationDialogOpen] = React.useState(false)
    const [activeCreationType, setActiveCreationType] = React.useState<string | null>(null)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showGenerationOverlay, setShowGenerationOverlay] = React.useState(false)

    // Handlers
    const openCreationDialog = (type: string) => {
        setActiveCreationType(type)
        setCreationDialogOpen(true)
    }

    const handleCreateArtifact = async (type: string, data: any) => {
        setIsGenerating(true)
        setShowGenerationOverlay(true)
        setCreationDialogOpen(false)

        try {
            const response = await fetch('/api/artifacts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, config: data })
            })

            if (!response.ok) throw new Error('Falha na geração')

            const result = await response.json()
            await new Promise(resolve => setTimeout(resolve, 3000))

            toast.success("Artefato gerado com sucesso!")
            setShowGenerationOverlay(false)
            setIsGenerating(false)
            // Ideally we'd refresh the "Recent" list here
            window.location.reload(); // Simple refresh for now or invalidate queries if using React Query
        } catch (error) {
            toast.error("Erro ao gerar artefato. Tente novamente.")
            setIsGenerating(false)
            setShowGenerationOverlay(false)
        }
    }

    const categories = [
        {
            title: "Pesquisa Científica",
            description: "Evidências clínicas e artigos acadêmicos baseados em fontes confiáveis.",
            icon: BookOpen,
            href: "/dashboard/biblioteca/pesquisa",
            colorClass: "bg-cyan-500",
            id: "research"
        },
        {
            title: "Resumos & Estudos",
            description: "Sintetize materiais complexos em resumos estruturados.",
            icon: Library,
            href: "/dashboard/biblioteca/resumo",
            colorClass: "bg-violet-500",
            id: "summary"
        },
        {
            title: "Simulados Práticos",
            description: "Teste seus conhecimentos com questões geradas por IA.",
            icon: GraduationCap,
            href: "/dashboard/biblioteca/simulado",
            colorClass: "bg-amber-500",
            id: "exam"
        },
        {
            title: "Flashcards",
            description: "Memorização ativa e repetição espaçada para provas.",
            icon: WalletCards,
            href: "/dashboard/biblioteca/flashcards",
            colorClass: "bg-orange-500",
            id: "flashcards"
        },
        {
            title: "Laudos Vision",
            description: "Arquivo de análises de radiografias e exames de imagem.",
            icon: Scan,
            href: "/dashboard/biblioteca/laudos",
            colorClass: "bg-sky-500",
            id: "vision"
        },
        {
            title: "Mapas Mentais",
            description: "Visualização estruturada de conexões entre tópicos.",
            icon: BrainCircuit,
            href: "/dashboard/biblioteca/mapas",
            colorClass: "bg-teal-500",
            id: "mindmap"
        }
    ]

    return (
        <div className="min-h-screen bg-background/50 relative overflow-hidden flex flex-col">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 py-8 md:px-8 space-y-12 relative z-10 max-w-[1600px]">

                {/* Header Section */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground leading-tight">
                            Biblioteca de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Conhecimento</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                            Centralize todo o seu aprendizado. Gerencie suas pesquisas, resumos e atividades práticas em ambientes dedicados.
                        </p>
                    </div>

                    {/* Quick Creation Hub */}
                    <div className="p-1">
                        <ArtifactCreationHub onSelectType={openCreationDialog} />
                    </div>
                </div>

                {/* Categories Grid */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        Ambientes de Estudo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat, idx) => (
                            <CategoryCard
                                key={idx}
                                {...cat}
                            />
                        ))}
                    </div>
                </div>

                {/* Recent Items Section */}
                <div className="pt-4 border-t border-border/20">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Recentes
                        </h2>
                    </div>
                    <ArtifactList
                        limit={4}
                        hideSearch
                        title="Atividades Recentes"
                        description="Seus últimos artefatos gerados aparecerão aqui."
                    />
                </div>
            </div>

            {/* Creation Dialogs (Reintegrated) */}
            <GenerationOverlay
                isOpen={showGenerationOverlay}
                onClose={() => setShowGenerationOverlay(false)}
                type={activeCreationType || ''}
                title={getLabelForType(activeCreationType || '')}
            />

            <Dialog open={creationDialogOpen} onOpenChange={setCreationDialogOpen}>
                <DialogContent className="glass-card border-white/10 sm:max-w-[600px] p-0 rounded-[2rem] overflow-hidden bg-card/95 backdrop-blur-2xl">
                    <div className="p-8 border-b border-white/5 bg-muted/10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                    {getIconForType(activeCreationType || '')}
                                </div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    Novo {getLabelForType(activeCreationType || '')}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-muted-foreground">
                                Preencha os detalhes abaixo para gerar seu artefato.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8">
                        {activeCreationType === 'summary' && (
                            <SummaryForm
                                onSubmit={(data) => handleCreateArtifact('summary', data)}
                                isLoading={isGenerating}
                            />
                        )}
                        {activeCreationType === 'research' && (
                            <ResearchForm
                                onSubmit={(data) => handleCreateArtifact('research', data)}
                                isLoading={isGenerating}
                            />
                        )}
                        {activeCreationType === 'exam' && (
                            <ExamForm
                                onSubmit={(data) => handleCreateArtifact('exam', data)}
                                isLoading={isGenerating}
                            />
                        )}
                        {activeCreationType === 'flashcards' && (
                            <FlashcardsForm
                                onSubmit={(data) => handleCreateArtifact('flashcards', data)}
                                isLoading={isGenerating}
                            />
                        )}
                        {activeCreationType === 'mindmap' && (
                            <MindMapForm
                                onSubmit={(data) => handleCreateArtifact('mindmap', data)}
                                isLoading={isGenerating}
                            />
                        )}
                        {['vision', 'writing'].includes(activeCreationType || '') && (
                            <div className="py-12 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Em Breve</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Este agente está em fase final de calibração.
                                </p>
                                <Button variant="outline" onClick={() => setCreationDialogOpen(false)} className="rounded-xl border-white/10">
                                    Voltar
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
