"use client"
import * as React from "react"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { BookOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResearchForm } from "@/components/artifacts/artifact-forms"
import { toast } from "sonner"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"

export default function ResearchPage() {
    const [creationOpen, setCreationOpen] = React.useState(false)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showOverlay, setShowOverlay] = React.useState(false)

    const handleCreate = async (data: any) => {
        setIsGenerating(true)
        setShowOverlay(true)
        setCreationOpen(false)
        try {
            const response = await fetch('/api/artifacts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'research', config: data })
            })
            if (!response.ok) throw new Error("Failed")
            await new Promise(r => setTimeout(r, 2000))
            toast.success("Pesquisa gerada com sucesso!")
            window.location.reload()
        } catch (e) {
            toast.error("Erro ao gerar pesquisa")
        } finally {
            setIsGenerating(false)
            setShowOverlay(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-[1600px]">
            <GenerationOverlay isOpen={showOverlay} onClose={() => setShowOverlay(false)} type="research" title="Pesquisa" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/biblioteca">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-cyan-400" />
                            Pesquisas Científicas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Acesse suas revisões bibliográficas e estudos baseados em evidências.
                        </p>
                    </div>
                </div>

                <Dialog open={creationOpen} onOpenChange={setCreationOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20">
                            <BookOpen className="mr-2 h-4 w-4" /> Nova Pesquisa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Nova Pesquisa Científica</DialogTitle>
                            <DialogDescription>Defina o tópico para buscar evidências científicas atualizadas.</DialogDescription>
                        </DialogHeader>
                        <ResearchForm onSubmit={handleCreate} isLoading={isGenerating} />
                    </DialogContent>
                </Dialog>
            </div>

            <ArtifactList type="research" emptyMessage="Nenhuma pesquisa encontrada" emptyActionLabel="Criar Pesquisa" onEmptyAction={() => setCreationOpen(true)} />
        </div>
    )
}
