"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { BrainCircuit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MindMapForm } from "@/components/artifacts/artifact-forms"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"
import { toast } from "sonner"

export default function MindMapPage() {
    const router = useRouter()
    const [creationOpen, setCreationOpen] = React.useState(false)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showOverlay, setShowOverlay] = React.useState(false)

    const handleGenerate = async (data: Record<string, unknown>) => {
        setIsGenerating(true)
        setShowOverlay(true)
        setCreationOpen(false)

        try {
            const response = await fetch('/api/artifacts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'mindmap', config: data })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha na geração')
            }

            toast.success("Mapa Mental criado!", {
                description: "Seu mapa está pronto para visualização."
            })

            setShowOverlay(false)
            setIsGenerating(false)
            // Refresh the page to show new artifact
            router.refresh()
        } catch (error) {
            console.error('Generation error:', error)
            toast.error("Erro ao gerar mapa mental", {
                description: error instanceof Error ? error.message : "Tente novamente."
            })
            setIsGenerating(false)
            setShowOverlay(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-[1600px]">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/biblioteca">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                            <BrainCircuit className="h-8 w-8 text-teal-400" />
                            Mapas Mentais
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Visualização estruturada de conceitos e conexões.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setCreationOpen(true)}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
                >
                    <BrainCircuit className="mr-2 h-4 w-4" /> Novo Mapa
                </Button>
            </div>

            <ArtifactList type="mindmap" emptyMessage="Nenhum mapa encontrado" emptyActionLabel="Criar Mapa" onEmptyAction={() => setCreationOpen(true)} />

            {/* Creation Dialog */}
            <Dialog open={creationOpen} onOpenChange={setCreationOpen}>
                <DialogContent className="glass-card border-white/10 sm:max-w-[600px] p-0 rounded-[2rem] overflow-hidden bg-card/95 backdrop-blur-2xl">
                    <div className="p-8 border-b border-white/5 bg-muted/10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500">
                                    <BrainCircuit className="h-5 w-5" />
                                </div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    Novo Mapa Mental
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-muted-foreground">
                                Configure os detalhes para gerar sua visualização.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8">
                        <MindMapForm
                            onSubmit={handleGenerate}
                            isLoading={isGenerating}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Generation Overlay */}
            <GenerationOverlay
                isOpen={showOverlay}
                onClose={() => {
                    if (!isGenerating) setShowOverlay(false)
                }}
                type="mindmap"
                title="Gerando Mapa Mental"
            />
        </div>
    )
}
