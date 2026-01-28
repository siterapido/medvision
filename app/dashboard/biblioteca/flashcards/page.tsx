"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { WalletCards, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FlashcardsForm } from "@/components/artifacts/artifact-forms"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"
import { toast } from "sonner"

export default function FlashcardsPage() {
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
                body: JSON.stringify({ type: 'flashcards', config: data })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha na geração')
            }

            toast.success("Deck de Flashcards criado!", {
                description: "Seu deck está pronto para estudo."
            })

            setShowOverlay(false)
            setIsGenerating(false)
            // Refresh the page to show new artifact
            router.refresh()
        } catch (error) {
            console.error('Generation error:', error)
            toast.error("Erro ao gerar flashcards", {
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
                            <WalletCards className="h-8 w-8 text-orange-400" />
                            Flashcards
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Decks de memorização com repetição espaçada.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setCreationOpen(true)}
                    className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                >
                    <WalletCards className="mr-2 h-4 w-4" /> Novo Deck
                </Button>
            </div>

            <ArtifactList type="flashcards" emptyMessage="Nenhum deck encontrado" emptyActionLabel="Criar Deck" onEmptyAction={() => setCreationOpen(true)} />

            {/* Creation Dialog */}
            <Dialog open={creationOpen} onOpenChange={setCreationOpen}>
                <DialogContent className="glass-card border-white/10 sm:max-w-[600px] p-0 rounded-[2rem] overflow-hidden bg-card/95 backdrop-blur-2xl">
                    <div className="p-8 border-b border-white/5 bg-muted/10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                                    <WalletCards className="h-5 w-5" />
                                </div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    Novo Deck de Flashcards
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-muted-foreground">
                                Configure os detalhes para gerar seu deck de estudo.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8">
                        <FlashcardsForm
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
                type="flashcards"
                title="Gerando Flashcards"
            />
        </div>
    )
}
