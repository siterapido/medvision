"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutGrid, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import type { ArtifactResult } from "@/components/chat/types"

interface FlashcardDeck {
    id: string
    title: string
    topic?: string
    cards?: Array<unknown>
    created_at: string
}

interface FlashcardsClientProps {
    userId: string
    decks: FlashcardDeck[] | null
}

export function FlashcardsClient({ userId, decks }: FlashcardsClientProps) {
    const router = useRouter()

    const handleArtifactCreated = (artifact: ArtifactResult) => {
        router.refresh()
    }

    return (
        <ArtifactPageLayout
            agentId="odonto-practice"
            userId={userId}
            onArtifactCreated={handleArtifactCreated}
        >
            <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Meus Flashcards
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Baralhos de memorização ativa gerados para potencializar seu aprendizado.
                        </p>
                    </div>
                </div>

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
            </div>
        </ArtifactPageLayout>
    )
}
