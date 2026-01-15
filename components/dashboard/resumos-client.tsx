"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, FileText, Tag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import type { ArtifactResult } from "@/components/chat/types"

interface Summary {
    id: string
    title: string
    topic?: string
    content?: string
    tags?: string[]
    created_at: string
}

interface ResumosClientProps {
    userId: string
    summaries: Summary[] | null
}

export function ResumosClient({ userId, summaries }: ResumosClientProps) {
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
                            Meus Resumos
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Resumos, flashcards e mapas mentais gerados para seu estudo.
                        </p>
                    </div>
                </div>

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
                                    <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            <span>{summary.tags?.length || 0} tags</span>
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
                                Use o chat ao lado para criar resumos, flashcards ou mapas mentais.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ArtifactPageLayout>
    )
}
