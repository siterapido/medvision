"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Loader2, AlertCircle, SearchX, Sparkles, ArrowUpRight, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useArtifacts, useDeleteArtifact } from "@/lib/hooks/use-artifacts"
import { ArtifactType, Artifact } from "@/lib/types/artifacts"
import { ArtifactCard } from "@/components/biblioteca/artifact-card"
import { ArtifactRenderer } from "@/components/artifacts/artifact-renderer"
import { convertToRenderArtifact, getIconForType, getLabelForType } from "@/lib/utils/artifact-utils"
import { toast } from "sonner"

interface ArtifactListProps {
    type?: ArtifactType | ArtifactType[]
    title?: string
    description?: string
    emptyMessage?: string
    emptyActionLabel?: string
    onEmptyAction?: () => void
    headerContent?: React.ReactNode
    limit?: number
    hideSearch?: boolean
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

export function ArtifactList({
    type,
    title,
    description,
    emptyMessage = "Sua biblioteca está vazia",
    emptyActionLabel = "Começar a Criar",
    onEmptyAction,
    headerContent,
    limit = 100,
    hideSearch = false
}: ArtifactListProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

    // Modal states
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [artifactToDelete, setArtifactToDelete] = React.useState<string | null>(null)
    const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false)
    const [selectedArtifact, setSelectedArtifact] = React.useState<Artifact | null>(null)

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const { data, isLoading, error, mutate } = useArtifacts({
        type: type as any, // Hook handles filtering logic
        search: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder,
        page: 1,
        limit: limit,
    })

    const { deleteArtifact, isDeleting } = useDeleteArtifact()

    const handleDelete = async () => {
        if (!artifactToDelete) return

        const success = await deleteArtifact(artifactToDelete)
        if (success) {
            toast.success("Conhecimento removido da sua biblioteca")
            mutate()
        } else {
            toast.error("Houve um problema ao remover este item")
        }
        setDeleteDialogOpen(false)
        setArtifactToDelete(null)
    }

    const openPreview = (item: Artifact) => {
        setSelectedArtifact(item)
        setPreviewDialogOpen(true)
    }

    const requestDelete = (id: string) => {
        setArtifactToDelete(id)
        setDeleteDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    {/* Optional custom header content injected here */}
                    {headerContent}
                </div>
                {!hideSearch && (
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Buscar nesta lista..."
                            className="pl-9 h-11 bg-muted/50 backdrop-blur-md border border-white/10 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-sm text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando biblioteca...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl p-10 max-w-md mx-auto">
                    <AlertCircle className="h-12 w-12 text-red-500/80 mb-4" />
                    <h3 className="text-lg font-bold">Erro na conexão</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-6">Não conseguimos recuperar seus artefatos no momento.</p>
                    <Button onClick={() => mutate()} variant="default" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                        Tentar Novamente
                    </Button>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center glass-card rounded-[2rem] p-12 max-w-xl mx-auto border-dashed border-white/10">
                    <div className="p-5 rounded-full bg-muted/30 border border-border/20 mb-6 shrink-0">
                        {searchTerm ? <SearchX className="h-10 w-10 text-muted-foreground/60" /> : <Sparkles className="h-10 w-10 text-primary/40" />}
                    </div>
                    <h3 className="text-xl font-bold">
                        {searchTerm ? "Nenhuma correspondência" : (title ? `Nenhum ${title} encontrado` : emptyMessage)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-sm">
                        {searchTerm
                            ? "Não encontramos itens com esse termo. Tente usar palavras-chave mais genéricas."
                            : (description || "Seus artefatos aparecerão aqui.")}
                    </p>
                    <Button onClick={() => searchTerm ? setSearchTerm("") : onEmptyAction?.()} className="rounded-xl px-10 h-12 gap-2 shadow-xl shadow-primary/20">
                        {searchTerm ? "Limpar Busca" : emptyActionLabel} {searchTerm ? null : <ArrowUpRight className="h-4 w-4" />}
                    </Button>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {data.map(item => (
                            <ArtifactCard
                                key={item.id}
                                item={item}
                                onPreview={openPreview}
                                onDelete={requestDelete}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass-card border-white/10 p-0 rounded-[2rem] overflow-hidden custom-scrollbar bg-background/95 backdrop-blur-3xl shadow-2xl">
                    {selectedArtifact && (
                        <div className="flex flex-col h-full">
                            <div className="p-8 border-b border-border/20 bg-muted/10 backdrop-blur-md">
                                <DialogHeader className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                            {getIconForType(selectedArtifact.type)}
                                        </div>
                                        <div>
                                            <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-widest font-bold">
                                                {getLabelForType(selectedArtifact.type)}
                                            </Badge>
                                            <DialogTitle className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                                                {selectedArtifact.title}
                                            </DialogTitle>
                                        </div>
                                    </div>
                                    <DialogDescription className="text-base text-muted-foreground/80 leading-relaxed">
                                        {selectedArtifact.description}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 pb-32">
                                <ArtifactRenderer
                                    artifact={convertToRenderArtifact(selectedArtifact)}
                                />
                            </div>

                            <div className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent flex justify-between items-center z-50 border-t border-border/10">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/20">
                                        <Clock className="h-3 w-3" />
                                        {new Date(selectedArtifact.createdAt).toLocaleString("pt-BR")}
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        <Sparkles className="h-3 w-3" />
                                        {selectedArtifact.aiContext.agent}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl" onClick={() => setPreviewDialogOpen(false)}>
                                        Fechar
                                    </Button>
                                    <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold" onClick={() => toast.info("Funcionalidade de exportação em breve")}>
                                        Exportar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="glass-card border-border/80 rounded-3xl bg-background/80 backdrop-blur-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Expurgar Conhecimento?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Esta ação removerá permanentemente este artefato da sua biblioteca digital. Deseja prosseguir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-border/40 hover:bg-muted">
                            Manter Item
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removendo...</>
                            ) : (
                                "Remover Permanentemente"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
