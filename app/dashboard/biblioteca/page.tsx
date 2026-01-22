"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, Code, Image as ImageIcon, Sparkles, Clock, MoreVertical, Search, Filter, Loader2, AlertCircle, Trash2, Library, BookOpen, BrainCircuit, WalletCards, GraduationCap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useArtifacts, useDeleteArtifact } from "@/lib/hooks/use-artifacts"
import { toast } from "sonner"
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

const getIconForType = (type: string) => {
    switch (type) {
        case "chat":
            return <MessageSquare className="h-5 w-5 text-blue-500" />
        case "document":
            return <FileText className="h-5 w-5 text-orange-500" />
        case "code":
            return <Code className="h-5 w-5 text-green-500" />
        case "image":
            return <ImageIcon className="h-5 w-5 text-purple-500" />
        case "research":
            return <BookOpen className="h-5 w-5 text-teal-500" />
        case "exam":
            return <GraduationCap className="h-5 w-5 text-indigo-500" />
        case "summary":
            return <Library className="h-5 w-5 text-pink-500" />
        case "flashcards":
            return <WalletCards className="h-5 w-5 text-amber-500" />
        case "mindmap":
            return <BrainCircuit className="h-5 w-5 text-cyan-500" />
        default:
            return <Sparkles className="h-5 w-5 text-gray-500" />
    }
}

const getLabelForType = (type: string) => {
    switch (type) {
        case "chat": return "Chat"
        case "document": return "Documento"
        case "code": return "Código"
        case "image": return "Imagem"
        case "research": return "Pesquisa"
        case "exam": return "Simulado"
        case "summary": return "Resumo"
        case "flashcards": return "Flashcards"
        case "mindmap": return "Mapa Mental"
        default: return "Outro"
    }
}

export default function BibliotecaPage() {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [selectedType, setSelectedType] = React.useState<ArtifactType | "all">("all")
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [artifactToDelete, setArtifactToDelete] = React.useState<string | null>(null)

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Fetch artifacts with filters
    const { data, isLoading, error, mutate } = useArtifacts({
        type: selectedType === "all" ? undefined : selectedType,
        search: debouncedSearch || undefined,
        page: 1,
        limit: 50,
    })

    const { deleteArtifact, isDeleting } = useDeleteArtifact()

    const handleDelete = async () => {
        if (!artifactToDelete) return

        const success = await deleteArtifact(artifactToDelete)
        if (success) {
            toast.success("Artefato excluído com sucesso!")
            mutate() // Revalidate data
        } else {
            toast.error("Erro ao excluir artefato")
        }
        setDeleteDialogOpen(false)
        setArtifactToDelete(null)
    }

    const ArtifactCard = ({ item }: { item: Artifact }) => (
        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    {getIconForType(item.type)}
                    <Badge variant="outline" className="capitalize">
                        {getLabelForType(item.type)}
                    </Badge>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem>Baixar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Contexto IA</DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                                setArtifactToDelete(item.id)
                                setDeleteDialogOpen(true)
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-lg line-clamp-1 mb-1">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">
                    {item.description}
                </CardDescription>

                {/* IA Context Section */}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                    <span className="font-medium">{item.aiContext.agent}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span>{item.aiContext.model}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                {/* Content Stat snippet */}
                {item.type === 'research' && (item.content as any)?.sources && (
                    <div className="flex items-center gap-1 bg-teal-500/10 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {(item.content as any).sources.length} fontes
                    </div>
                )}
                {item.type === 'exam' && (item.content as any)?.questions && (
                    <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {(item.content as any).questions.length} questões
                    </div>
                )}
                {item.type === 'flashcards' && (item.content as any)?.cards && (
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {(item.content as any).cards.length} cards
                    </div>
                )}
            </CardFooter>
        </Card>
    )

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Biblioteca</h1>
                    <p className="text-muted-foreground mt-1">
                        Seus artefatos gerados, documentos e históricos de chat.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar artefatos..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 mb-6 bg-transparent gap-2">
                    <TabsTrigger
                        value="all"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all"
                    >
                        Todos
                    </TabsTrigger>
                    <TabsTrigger
                        value="chat"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all"
                    >
                        Chats
                    </TabsTrigger>
                    <TabsTrigger
                        value="document"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all"
                    >
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger
                        value="research"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Pesquisas
                    </TabsTrigger>
                    <TabsTrigger
                        value="exam"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Simulados
                    </TabsTrigger>
                    <TabsTrigger
                        value="summary"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Resumos
                    </TabsTrigger>
                    <TabsTrigger
                        value="flashcards"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Flashcards
                    </TabsTrigger>
                    <TabsTrigger
                        value="mindmap"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Mapas Mentais
                    </TabsTrigger>
                    <TabsTrigger
                        value="image"
                        className="rounded-full px-4 py-2 ring-1 ring-zinc-200 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:ring-cyan-500 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                        Imagens
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={selectedType} className="mt-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <p className="text-lg font-medium text-foreground">Erro ao carregar artefatos</p>
                            <p className="text-sm text-muted-foreground mt-1">Tente novamente mais tarde</p>
                            <Button onClick={() => mutate()} variant="outline" className="mt-4">
                                Tentar novamente
                            </Button>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground">Nenhum artefato encontrado</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchTerm ? "Tente ajustar sua busca" : "Comece criando artefatos no chat"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.map(item => (
                                <ArtifactCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O artefato será permanentemente excluído.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
