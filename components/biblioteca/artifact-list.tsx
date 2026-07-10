"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Loader2, AlertCircle, SearchX, Scan, ArrowUpRight, Clock, PenLine } from "lucide-react"
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
import { ArtifactRow } from "@/components/biblioteca/artifact-row"
import { ArtifactRenderer } from "@/components/artifacts/artifact-renderer"
import { convertToRenderArtifact, getIconForType, getLabelForType } from "@/lib/utils/artifact-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateVisionPDF } from "@/lib/utils/generate-vision-pdf"
import { fetchVisionPdfSigner } from "@/lib/utils/fetch-vision-pdf-signer"
import type { VisionArtifactContent } from "@/lib/types/vision"
import { ensureImageDataUrl, getVisionImageSrc } from "@/lib/vision/persist-vision-image"

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
    variant?: "grid" | "dense"
    /** Filtra laudos pelo ID interno do paciente. */
    patientKeyFilter?: string | null
    /** Agrupa lista densa por patientKey quando presente. */
    groupByPatient?: boolean
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
    hideSearch = false,
    variant = "grid",
    patientKeyFilter = null,
    groupByPatient = false,
}: ArtifactListProps) {
    const isDense = variant === "dense"
    const [searchTerm, setSearchTerm] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
    const [signingId, setSigningId] = React.useState<string | null>(null)

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

    const filteredData = React.useMemo(() => {
        if (!patientKeyFilter) return data
        return data.filter((item) => item.patientKey === patientKeyFilter)
    }, [data, patientKeyFilter])

    const groupedDense = React.useMemo(() => {
        if (!groupByPatient || !isDense) return null
        const groups = new Map<string, Artifact[]>()
        for (const item of filteredData) {
            const key = item.patientKey?.trim() || "Sem ID paciente"
            const list = groups.get(key) ?? []
            list.push(item)
            groups.set(key, list)
        }
        return Array.from(groups.entries())
    }, [filteredData, groupByPatient, isDense])

    const handleDelete = async () => {
        if (!artifactToDelete) return

        const success = await deleteArtifact(artifactToDelete)
        if (success) {
            toast.success(isDense ? "Laudo removido" : "Conhecimento removido da sua biblioteca")
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

    const signSelected = async () => {
        if (!selectedArtifact || selectedArtifact.signedAt) return
        setSigningId(selectedArtifact.id)
        try {
            const res = await fetch(`/api/laudos/${selectedArtifact.id}/sign`, {
                method: "POST",
            })
            const body = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(body?.error || "Falha ao assinar")
            }
            toast.success("Laudo assinado")
            setSelectedArtifact({
                ...selectedArtifact,
                signedAt: body?.signedAt ?? new Date().toISOString(),
            })
            mutate()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao assinar laudo")
        } finally {
            setSigningId(null)
        }
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
                            className={cn(
                                "pl-9 h-10 text-sm text-ink transition-colors",
                                isDense
                                    ? "rounded-lg border-rule bg-surface focus-visible:border-signal/40 focus-visible:ring-signal/15"
                                    : "h-11 bg-muted/50 backdrop-blur-md border border-white/10 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50 text-foreground"
                            )}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {isLoading ? (
                isDense ? (
                    <div className="space-y-0 rounded-xl border border-rule bg-surface-raised">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 border-b border-rule px-4 py-3 last:border-b-0"
                            >
                                <div className="h-3 w-16 animate-pulse rounded bg-surface" />
                                <div className="hidden h-3 w-20 animate-pulse rounded bg-surface sm:block" />
                                <div className="h-3 w-16 animate-pulse rounded bg-surface" />
                                <div className="h-3 flex-1 animate-pulse rounded bg-surface" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
                        <p className="text-sm font-medium text-muted-foreground">Sincronizando laudos...</p>
                    </div>
                )
            ) : error ? (
                isDense ? (
                    <div className="flex flex-col items-start gap-3 rounded-xl border border-rule bg-surface-raised px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-clinical-alert" />
                            <p className="text-sm text-ink-muted">
                                Não foi possível carregar os laudos. Verifique a conexão e tente novamente.
                            </p>
                        </div>
                        <Button onClick={() => mutate()} variant="outline" size="sm" className="shrink-0">
                            Tentar novamente
                        </Button>
                    </div>
                ) : (
                    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 py-20 text-center shadow-sm">
                        <AlertCircle className="h-12 w-12 text-red-500/80 mb-4" />
                        <h3 className="text-lg font-bold">Erro na conexão</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-6">Não conseguimos recuperar seus artefatos no momento.</p>
                        <Button onClick={() => mutate()} variant="default" className="rounded-xl px-8">
                            Tentar Novamente
                        </Button>
                    </div>
                )
            ) : data.length === 0 ? (
                isDense ? (
                    <div className="flex flex-col items-start gap-4 rounded-xl border border-rule bg-surface-raised px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-ink-muted">
                            {searchTerm
                                ? "Nenhum laudo corresponde à busca."
                                : emptyMessage}
                        </p>
                        <Button
                            onClick={() => (searchTerm ? setSearchTerm("") : onEmptyAction?.())}
                            size="sm"
                            className="shrink-0"
                        >
                            {searchTerm ? "Limpar busca" : emptyActionLabel}
                        </Button>
                    </div>
                ) : (
                    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 py-24 text-center">
                        <div className="mb-6 shrink-0 rounded-full border border-border bg-muted p-5">
                            {searchTerm ? <SearchX className="h-10 w-10 text-muted-foreground" /> : <Scan className="h-10 w-10 text-primary/70" />}
                        </div>
                        <h3 className="text-xl font-bold">
                            {searchTerm ? "Nenhuma correspondência" : (title ? `Nenhum ${title} encontrado` : emptyMessage)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-sm">
                            {searchTerm
                                ? "Não encontramos itens com esse termo. Tente usar palavras-chave mais genéricas."
                                : (description || "Seus artefatos aparecerão aqui.")}
                        </p>
                        <Button onClick={() => searchTerm ? setSearchTerm("") : onEmptyAction?.()} className="h-11 gap-2 rounded-xl px-10">
                            {searchTerm ? "Limpar Busca" : emptyActionLabel} {searchTerm ? null : <ArrowUpRight className="h-4 w-4" />}
                        </Button>
                    </div>
                )
            ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-start gap-4 rounded-xl border border-rule bg-surface-raised px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-ink-muted">
                        Nenhum laudo para este paciente.
                    </p>
                </div>
            ) : isDense ? (
                <div className="overflow-hidden rounded-xl border border-rule bg-surface-raised">
                    <div className="hidden border-b border-rule bg-surface px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-[6rem_7rem_6rem_1fr_2rem] sm:gap-4">
                        <span>Data</span>
                        <span>Tipo</span>
                        <span>Status</span>
                        <span>Preview</span>
                        <span className="sr-only">Ações</span>
                    </div>
                    {groupedDense
                        ? groupedDense.map(([groupKey, items]) => (
                            <div key={groupKey}>
                                <div className="border-b border-rule bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                                    {groupKey}
                                </div>
                                {items.map((item) => (
                                    <ArtifactRow
                                        key={item.id}
                                        item={item}
                                        onPreview={openPreview}
                                        onDelete={requestDelete}
                                    />
                                ))}
                            </div>
                        ))
                        : filteredData.map((item) => (
                            <ArtifactRow
                                key={item.id}
                                item={item}
                                onPreview={openPreview}
                                onDelete={requestDelete}
                            />
                        ))}
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredData.map(item => (
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
                <DialogContent className={cn(
                    "max-w-5xl max-h-[90vh] overflow-y-auto p-0 overflow-hidden custom-scrollbar",
                    isDense
                        ? "rounded-xl border border-rule bg-surface-raised shadow-none"
                        : "glass-card border-white/10 rounded-[2rem] bg-background/95 backdrop-blur-3xl shadow-2xl"
                )}>
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
                                        <Scan className="h-3 w-3" />
                                        {selectedArtifact.aiContext.agent}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl" onClick={() => setPreviewDialogOpen(false)}>
                                        Fechar
                                    </Button>
                                    {selectedArtifact.type === "vision" && !selectedArtifact.signedAt && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl gap-1.5"
                                            disabled={signingId === selectedArtifact.id}
                                            onClick={() => { void signSelected() }}
                                        >
                                            {signingId === selectedArtifact.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <PenLine className="h-4 w-4" />
                                            )}
                                            Assinar laudo
                                        </Button>
                                    )}
                                    {selectedArtifact.type === "vision" && selectedArtifact.signedAt && (
                                        <Badge variant="outline" className="h-10 px-3 text-clinical-ok border-clinical-ok/30">
                                            Assinado
                                        </Badge>
                                    )}
                                    <Button
                                        className="rounded-xl shadow-lg shadow-primary/20 font-bold"
                                        onClick={() => {
                                            if (!selectedArtifact) return
                                            if (selectedArtifact.type !== "vision") {
                                                toast.info("Exportação PDF disponível para laudos Med Vision")
                                                return
                                            }
                                            const content = selectedArtifact.content as VisionArtifactContent | undefined
                                            const imageSrc = content ? getVisionImageSrc(content) : undefined
                                            if (!content?.analysis || !imageSrc) {
                                                toast.error("Laudo sem dados suficientes para exportar")
                                                return
                                            }
                                            toast.promise(
                                                (async () => {
                                                    const signer = await fetchVisionPdfSigner()
                                                    const imageDataUrl = await ensureImageDataUrl(imageSrc)
                                                    await generateVisionPDF({
                                                        analysisResult: content.analysis,
                                                        imageBase64: imageDataUrl,
                                                        refinements: content.refinements || [],
                                                        variant: "laudo",
                                                        signer,
                                                    })
                                                    void fetch(`/api/laudos/${selectedArtifact.id}/audit`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ action: "exported" }),
                                                    })
                                                })(),
                                                {
                                                    loading: "Gerando PDF...",
                                                    success: "PDF exportado",
                                                    error: "Erro ao exportar PDF",
                                                },
                                            )
                                        }}
                                    >
                                        Exportar PDF
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className={cn(
                    "rounded-xl",
                    isDense
                        ? "border border-rule bg-surface-raised shadow-none"
                        : "glass-card border-border/80 rounded-3xl bg-background/80 backdrop-blur-2xl"
                )}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">
                            {isDense ? "Remover laudo?" : "Expurgar Conhecimento?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            {isDense
                                ? "Esta ação remove permanentemente o laudo salvo. Deseja continuar?"
                                : "Esta ação removerá permanentemente este artefato da sua biblioteca digital. Deseja prosseguir?"}
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
