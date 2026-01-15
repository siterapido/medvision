"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Microscope, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import type { ArtifactResult } from "@/components/chat/types"
import { deleteArtifact } from "@/app/actions/artifacts"
import { DeleteButton } from "@/components/ui/delete-button"

interface Research {
    id: string
    title: string
    query?: string
    type?: string
    sources?: Array<unknown>
    created_at: string
}

interface PesquisasClientProps {
    userId: string
    researches: Research[] | null
}

export function PesquisasClient({ userId, researches }: PesquisasClientProps) {
    const router = useRouter()

    const handleArtifactCreated = (artifact: ArtifactResult) => {
        router.refresh()
    }

    return (
        <ArtifactPageLayout
            agentId="odonto-research"
            userId={userId}
            onArtifactCreated={handleArtifactCreated}
        >
            <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Minhas Pesquisas
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Evidências científicas e revisões de literatura geradas pelo Dr. Ciência.
                        </p>
                    </div>
                </div>

                {researches && researches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {researches.map((research) => (
                            <Link key={research.id} href={`/dashboard/pesquisas/${research.id}`} className="block group">
                                <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-500 group-hover:-translate-y-1">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800">
                                                {research.type === 'literature_review' ? 'Revisão' : 'Pesquisa'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(research.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-2 text-lg group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {research.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-3 h-24 overflow-hidden">
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {research.query}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-1 group-hover:text-cyan-500 transition-colors">
                                            <Microscope className="w-3 h-3" />
                                            <span>{research.sources?.length || 0} fontes</span>
                                        </div>
                                        <div className="flex z-20">
                                            <DeleteButton
                                                itemName="este item"
                                                onDelete={async () => {
                                                    await deleteArtifact(research.id, 'research_artifacts')
                                                }}
                                            />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center min-h-[350px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center animate-pulse">
                                    <Microscope className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                                Nenhuma pesquisa encontrada
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Use o chat ao lado para iniciar uma nova pesquisa científica.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ArtifactPageLayout>
    )
}
