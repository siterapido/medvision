"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    FileText,
    MessageSquare,
    Code,
    Image as ImageIcon,
    Sparkles,
    Clock,
    MoreVertical,
    Search,
    Filter,
    Loader2,
    AlertCircle,
    Trash2,
    Library,
    BookOpen,
    BrainCircuit,
    WalletCards,
    GraduationCap,
    ArrowUpRight,
    SearchX,
    LayoutDashboard,
    SortAsc
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useArtifacts, useDeleteArtifact } from "@/lib/hooks/use-artifacts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ArtifactType, Artifact } from "@/lib/types/artifacts"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ArtifactRenderer } from "@/components/artifacts/artifact-renderer"

const getIconForType = (type: string) => {
    switch (type) {
        case "chat":
            return <MessageSquare className="h-5 w-5 text-indigo-400" />
        case "document":
            return <FileText className="h-5 w-5 text-blue-400" />
        case "code":
            return <Code className="h-5 w-5 text-emerald-400" />
        case "image":
            return <ImageIcon className="h-5 w-5 text-pink-400" />
        case "research":
            return <BookOpen className="h-5 w-5 text-cyan-400" />
        case "exam":
            return <GraduationCap className="h-5 w-5 text-amber-400" />
        case "summary":
            return <Library className="h-5 w-5 text-violet-400" />
        case "flashcards":
            return <WalletCards className="h-5 w-5 text-orange-400" />
        case "mindmap":
            return <BrainCircuit className="h-5 w-5 text-teal-400" />
        default:
            return <Sparkles className="h-5 w-5 text-slate-400" />
    }
}

const getLabelForType = (type: string) => {
    switch (type) {
        case "chat": return "Conversa"
        case "document": return "Documento"
        case "code": return "Código"
        case "image": return "Imagem"
        case "research": return "Pesquisa"
        case "exam": return "Simulado"
        case "summary": return "Resumo"
        case "flashcards": return "Flashcards"
        case "mindmap": return "Mapa Mental"
        default: return "Artefato"
    }
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

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    }
}

export default function BibliotecaPage() {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [selectedType, setSelectedType] = React.useState<ArtifactType | "all">("all")
    const [sortBy, setSortBy] = React.useState<'createdAt' | 'title'>('createdAt')
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

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
        type: selectedType === "all" ? undefined : selectedType,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        page: 1,
        limit: 100,
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

    const ArtifactCard = ({ item }: { item: Artifact }) => (
        <motion.div variants={itemVariants} className="group h-full">
            <Card
                onClick={() => openPreview(item)}
                className={cn(
                    "h-full relative overflow-hidden transition-all duration-300 cursor-pointer",
                    "h-full relative overflow-hidden transition-all duration-500 cursor-pointer",
                    "glass-card border-white/10 dark:border-white/5",
                    "hover:border-primary/50 hover:shadow-premium hover:-translate-y-1.5 group-hover:bg-accent/5"
                )}
            >
                {/* Visual Accent Layer */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.12] transition-opacity">
                    {getIconForType(item.type)}
                </div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl bg-muted/50 border border-border/10",
                            "group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors"
                        )}>
                            {getIconForType(item.type)}
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-muted-foreground/20 text-muted-foreground bg-muted/30">
                            {getLabelForType(item.type)}
                        </Badge>
                    </div>
                    <DropdownMenu onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass w-48">
                            <DropdownMenuItem className="gap-2 focus:bg-primary/10" onClick={() => openPreview(item)}>
                                <ArrowUpRight className="h-4 w-4" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 focus:bg-primary/10" onClick={() => toast.info("Funcionalidade de contexto em breve")}>
                                <Sparkles className="h-4 w-4" /> Ver Contexto IA
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-500 gap-2 focus:bg-red-500/10 focus:text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setArtifactToDelete(item.id)
                                    setDeleteDialogOpen(true)
                                }}
                            >
                                <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div>
                        <CardTitle className="text-lg font-heading font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1.5 line-clamp-2 leading-relaxed opacity-80">
                            {item.description}
                        </CardDescription>
                    </div>

                    {/* Meta Section */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                        <div className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-secondary/50 text-[10px] font-medium text-muted-foreground border border-border/10">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-primary/5 text-[10px] font-bold text-primary/80 border border-primary/10">
                            <Sparkles className="h-3 w-3" />
                            {item.aiContext.agent}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4 mt-auto">
                    {/* Stats snippets with more refined design */}
                    {item.type === 'research' && (item.content as any)?.sources && (
                        <div className="w-full text-[11px] font-medium text-cyan-400 flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                            {(item.content as any).sources.length} referências bibliográficas
                        </div>
                    )}
                    {item.type === 'exam' && (item.content as any)?.questions && (
                        <div className="w-full text-[11px] font-medium text-amber-400 flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                            {(item.content as any).questions.length} questões práticas
                        </div>
                    )}
                    {item.type === 'mindmap' && (
                        <div className="w-full text-[11px] font-medium text-teal-400 flex items-center gap-1.5 group-hover:text-teal-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-teal-500 animate-pulse" />
                            Estrutura de conhecimento
                        </div>
                    )}
                    {!['research', 'exam', 'mindmap'].includes(item.type) && (
                        <div className="w-full text-[11px] font-medium text-muted-foreground/60 italic">
                            Ver detalhes do artefato
                        </div>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    )

    return (
        <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden min-h-screen">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 py-10 md:px-10 md:py-16 space-y-12 relative z-10 max-w-[1600px]">
                {/* Editorial Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-border/50">
                    <div className="max-w-2xl space-y-3">
                        <div className="flex items-center gap-3 mb-2 animate-in slide-in-from-left duration-700">
                            <div className="h-8 w-1 rounded-full bg-primary" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Sua Memória Digital</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight text-foreground/90 line-height-[1.1]">
                            Biblioteca de <span className="text-gradient">Inteligência</span>
                        </h1>
                        <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-lg">
                            Acesse todos os seus artefatos, pesquisas e descobertas estruturadas pelos nossos agentes odontológicos.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto animate-in slide-in-from-right duration-700">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="search"
                                placeholder="Buscar no seu conhecimento..."
                                className="pl-11 h-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 px-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all gap-2">
                                    <SortAsc className="h-4 w-4" />
                                    <span className="text-xs font-semibold">Ordenar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card w-56 p-2">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Critérios</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-lg gap-2" onClick={() => setSortBy('createdAt')}>
                                    <Clock className="h-4 w-4" /> Data de Criação {sortBy === 'createdAt' && "✓"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg gap-2" onClick={() => setSortBy('title')}>
                                    <SortAsc className="h-4 w-4" /> Título (A-Z) {sortBy === 'title' && "✓"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/10" />
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Ordem</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-lg justify-between" onClick={() => setSortOrder('asc')}>
                                    Crescente {sortOrder === 'asc' && "✓"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg justify-between" onClick={() => setSortOrder('desc')}>
                                    Decrescente {sortOrder === 'desc' && "✓"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="w-full space-y-8">
                    <div className="sticky top-0 z-20 py-2 bg-background/50 backdrop-blur-sm -mx-6 px-6">
                        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/20 backdrop-blur-xl border border-border/10 rounded-2xl gap-1 custom-scrollbar scrollbar-hidden">
                            {[
                                { value: "all", label: "Todos", icon: LayoutDashboard },
                                { value: "chat", label: "Conversas", icon: MessageSquare },
                                { value: "document", label: "Documentos", icon: FileText },
                                { value: "research", label: "Pesquisas", icon: BookOpen },
                                { value: "exam", label: "Simulados", icon: GraduationCap },
                                { value: "summary", label: "Resumos", icon: Library },
                                { value: "flashcards", label: "Flashcards", icon: WalletCards },
                                { value: "mindmap", label: "Mapas", icon: BrainCircuit },
                                { value: "image", label: "Imagens", icon: ImageIcon },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={cn(
                                        "rounded-xl px-5 py-2.5 h-10 text-xs font-semibold gap-2 border border-transparent transition-all capitalize whitespace-nowrap",
                                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20",
                                        "hover:bg-muted/50"
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value={selectedType} className="mt-0 outline-none">
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
                                    {searchTerm ? "Nenhuma correspondência" : "Sua biblioteca está vazia"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-sm">
                                    {searchTerm
                                        ? "Não encontramos itens com esse termo. Tente usar palavras-chave mais genéricas."
                                        : "Seus artefatos gerados aparecerão aqui. Comece uma conversa com nossos especialistas agora."}
                                </p>
                                <Button onClick={() => setSearchTerm("")} className="rounded-xl px-10 h-12 gap-2 shadow-xl shadow-primary/20">
                                    {searchTerm ? "Limpar Busca" : "Começar a Criar"} <ArrowUpRight className="h-4 w-4" />
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
                                        <ArtifactCard key={item.id} item={item} />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

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
                                    artifact={{
                                        ...selectedArtifact,
                                        kind: selectedArtifact.type === 'chat' ? 'text' : selectedArtifact.type as any,
                                    } as any}
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
