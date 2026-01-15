"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, FileText, Tag, LayoutGrid, Network, ArrowRight, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import type { ArtifactResult } from "@/components/chat/types"
import { deleteArtifact } from "@/app/actions/artifacts"
import { DeleteButton } from "@/components/ui/delete-button"

interface Summary {
    id: string
    title: string
    topic?: string
    content?: string
    tags?: string[]
    created_at: string
}

interface FlashcardDeck {
    id: string
    title: string
    topic?: string
    cards?: Array<unknown>
    created_at: string
}

interface MindMap {
    id: string
    title: string
    topic?: string
    created_at: string
}

interface ResumosClientProps {
    userId: string
    summaries: Summary[] | null
    decks: FlashcardDeck[] | null
    maps: MindMap[] | null
}

export function ResumosClient({ userId, summaries, decks, maps }: ResumosClientProps) {
    const router = useRouter()

    const handleArtifactCreated = (artifact: ArtifactResult) => {
        // Refresh page to show new artifact
        router.refresh()
    }

    return (
        <ArtifactPageLayout
            agentId="odonto-summary"
            userId={userId}
            onArtifactCreated={handleArtifactCreated}
        >
            <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                            Meus Materiais de Estudo
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Centralize seus resumos, flashcards e mapas mentais.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="summaries" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="summaries" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Resumos
                        </TabsTrigger>
                        <TabsTrigger value="flashcards" className="gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Flashcards
                        </TabsTrigger>
                        <TabsTrigger value="mindmaps" className="gap-2">
                            <Network className="w-4 h-4" />
                            Mapas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summaries" className="space-y-6">
                        {summaries && summaries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {summaries.map((summary) => (
                                    <Link key={summary.id} href={`/dashboard/resumos/${summary.id}`} className="block group">
                                        <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-violet-500/50 hover:shadow-md transition-all duration-300">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                                                        Resumo
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                                <CardTitle className="line-clamp-2 text-lg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {summary.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pb-3 h-24 overflow-hidden">
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                        Topic: {summary.topic}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {summary.content?.substring(0, 150)}...
                                                </p>
                                            </CardContent>
                                            <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-2 justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    <span>{summary.tags?.length || 0} tags</span>
                                                </div>
                                                <div className="flex z-20">
                                                    <DeleteButton
                                                        itemName="este resumo"
                                                        onDelete={async () => {
                                                            await deleteArtifact(summary.id, 'summaries')
                                                        }}
                                                    />
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-center justify-center min-h-[350px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">
                                        Nenhum resumo encontrado
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Use o chat ao lado para criar resumos de seus estudos.
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="flashcards" className="space-y-6">
                        {decks && decks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {decks.map((deck) => (
                                    <Link key={deck.id} href={`/dashboard/flashcards/${deck.id}`} className="block group">
                                        <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-orange-500/50 hover:shadow-md transition-all duration-300">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                                        Flashcards
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                                <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                    {deck.title}
                                                </CardTitle>
                                                <CardDescription>{deck.topic}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pb-3">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <LayoutGrid className="w-4 h-4" />
                                                    <span>{Array.isArray(deck.cards) ? deck.cards.length : 0} cartas</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                                    <Play className="w-3 h-3" />
                                                    <span>Estudar agora</span>
                                                </div>
                                                <div className="flex z-20">
                                                    <DeleteButton
                                                        itemName="este baralho"
                                                        onDelete={async () => {
                                                            await deleteArtifact(deck.id, 'flashcard_decks')
                                                        }}
                                                    />
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-center justify-center min-h-[350px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                            <LayoutGrid className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">
                                        Nenhum baralho encontrado
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Use o chat ao lado para criar flashcards de qualquer tema.
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="mindmaps" className="space-y-6">
                        {maps && maps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {maps.map((map) => (
                                    <Link key={map.id} href={`/dashboard/mindmaps/${map.id}`} className="block group">
                                        <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-pink-500/50 hover:shadow-md transition-all duration-300">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800">
                                                        Mapa Mental
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(map.created_at), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                                <CardTitle className="line-clamp-2 text-lg group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                    {map.title}
                                                </CardTitle>
                                                <CardDescription>{map.topic}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pb-3">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Network className="w-4 h-4" />
                                                    <span>Conexões Visuais</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-xs text-pink-500 font-medium">
                                                    <span>Explorar mapa</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <div className="flex z-20">
                                                    <DeleteButton
                                                        itemName="este mapa"
                                                        onDelete={async () => {
                                                            await deleteArtifact(map.id, 'mind_map_artifacts')
                                                        }}
                                                    />
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-center justify-center min-h-[350px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                            <Network className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">
                                        Nenhum mapa mental
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Use o chat ao lado para gerar mapas mentais de qualquer tema.
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </ArtifactPageLayout>
    )
}
