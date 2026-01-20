"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClipboardList, GraduationCap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import type { ArtifactResult } from "@/components/chat/types"

interface Exam {
    id: string
    title: string
    topic?: string
    specialty?: string
    difficulty?: string
    exam_type?: string
    created_at: string
}

interface QuestionariosClientProps {
    userId: string
    exams: Exam[] | null
}

export function QuestionariosClient({ userId, exams }: QuestionariosClientProps) {
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
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            Meus Questionários
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Simulados e questões de prática gerados pelo Odonto Practice.
                        </p>
                    </div>
                </div>

                {exams && exams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {exams.map((exam) => (
                            <Link key={exam.id} href={`/dashboard/questionarios/${exam.id}`} className="block group">
                                <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-green-500/50 hover:shadow-md transition-all duration-300">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                                {exam.specialty || "Geral"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-2 text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                            {exam.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <Badge variant="secondary" className="font-normal text-xs">
                                                {exam.difficulty}
                                            </Badge>
                                            <Badge variant="secondary" className="font-normal text-xs">
                                                {exam.exam_type}
                                            </Badge>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                            {exam.topic}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <ClipboardList className="w-3 h-3" />
                                            <span>Praticar</span>
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
                                <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                Nenhum questionário encontrado
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Use o chat ao lado para criar simulados personalizados.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ArtifactPageLayout>
    )
}
