"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { Scan, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LaudoEditor } from "@/components/artifacts/laudo-editor"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"

export default function LaudosPage() {
    const router = useRouter()
    const [creationOpen, setCreationOpen] = React.useState(false)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showOverlay, setShowOverlay] = React.useState(false)

    const handleGenerate = async (data: Record<string, unknown>, imageFile: File | null) => {
        setIsGenerating(true)
        setShowOverlay(true)
        setCreationOpen(false)

        try {
            let imageBase64 = ''
            if (imageFile) {
                const reader = new FileReader()
                imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(imageFile)
                })
            }

            const response = await fetch('/api/artifacts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'vision', config: { ...data, imageBase64 } })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha na geração')
            }

            toast.success("Laudo gerado com sucesso!", {
                description: "A análise está pronta para revisão."
            })

            setShowOverlay(false)
            setIsGenerating(false)
            router.refresh()
        } catch (error) {
            console.error('Generation error:', error)
            toast.error("Erro ao gerar laudo", {
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
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                            <Scan className="h-8 w-8 text-sky-400" />
                            Laudos
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Histórico de análises de imagens radiográficas e fotografias clínicas.
                        </p>
                    </div>
                </div>

                <Button
                    className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20"
                    onClick={() => setCreationOpen(true)}
                >
                    <Scan className="mr-2 h-4 w-4" /> Nova Análise
                </Button>
            </div>

            <ArtifactList type="vision" emptyMessage="Nenhum laudo encontrado" emptyActionLabel="Nova Análise" onEmptyAction={() => setCreationOpen(true)} />

            <Dialog open={creationOpen} onOpenChange={setCreationOpen}>
                <DialogContent className="glass-card border-white/10 sm:max-w-[700px] p-0 rounded-[2rem] overflow-hidden bg-card/95 backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-8 border-b border-white/5 bg-muted/10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500">
                                    <Scan className="h-5 w-5" />
                                </div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    Nova Análise Vision
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-muted-foreground">
                                Faça upload de uma imagem radiográfica para análise por IA.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8">
                        <LaudoEditor
                            onSubmit={handleGenerate}
                            isLoading={isGenerating}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <GenerationOverlay
                isOpen={showOverlay}
                onClose={() => {
                    if (!isGenerating) setShowOverlay(false)
                }}
                type="vision"
                title="Analisando Imagem"
            />
        </div>
    )
}