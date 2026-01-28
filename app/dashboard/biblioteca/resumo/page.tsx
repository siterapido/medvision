"use client"
import * as React from "react"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { Library, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SummaryForm } from "@/components/artifacts/artifact-forms"
import { toast } from "sonner"
import { GenerationOverlay } from "@/components/artifacts/generation-overlay"

export default function SummaryPage() {
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
                body: JSON.stringify({ type: 'summary', config: data })
            })
            if (!response.ok) throw new Error("Failed")
            await new Promise(r => setTimeout(r, 2000))
            toast.success("Resumo gerado com sucesso!")
            window.location.reload()
        } catch (e) {
            toast.error("Erro ao gerar resumo")
        } finally {
            setIsGenerating(false)
            setShowOverlay(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-[1600px]">
            <GenerationOverlay isOpen={showOverlay} onClose={() => setShowOverlay(false)} type="summary" title="Resumo" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/biblioteca">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
                            <Library className="h-8 w-8 text-violet-400" />
                            Resumos e Estudos
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Seus materiais de estudo sintetizados e organizados por tópicos.
                        </p>
                    </div>
                </div>

                <Dialog open={creationOpen} onOpenChange={setCreationOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                            <Library className="mr-2 h-4 w-4" /> Novo Resumo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Novo Resumo de Estudo</DialogTitle>
                            <DialogDescription>Gere um resumo estruturado sobre qualquer tema odontológico.</DialogDescription>
                        </DialogHeader>
                        <SummaryForm onSubmit={handleCreate} isLoading={isGenerating} />
                    </DialogContent>
                </Dialog>
            </div>

            <ArtifactList type="summary" emptyMessage="Nenhum resumo encontrado" emptyActionLabel="Criar Resumo" onEmptyAction={() => setCreationOpen(true)} />
        </div>
    )
}
