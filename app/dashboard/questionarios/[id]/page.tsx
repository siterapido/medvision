
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, GraduationCap, Clock, Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PracticeExamContent } from "@/components/artifacts/practice-exam-content"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ExamDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: exam, error } = await supabase
        .from("practice_exams")
        .select("*, practice_questions(*)")
        .eq("id", id)
        .single()

    if (error || !exam) {
        notFound()
    }

    // Sort questions by order_index
    if (exam.practice_questions) {
        exam.practice_questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <ArtifactPageLayout
                agentId="odonto-practice"
                userId={user.id}
            >
                <div className="flex flex-col min-h-full">
                    {/* Top Navigation */}
                    <div className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <Link href="/dashboard/questionarios">
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                                        {exam.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <GraduationCap className="w-3 h-3 text-violet-500" />
                                        <span>Simulado Acadêmico</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4 hidden md:flex">
                                <Badge variant="outline" className="border-violet-200 dark:border-violet-900 flex gap-1 items-center bg-violet-500/5">
                                    <Clock className="w-3 h-3 text-violet-500" />
                                    <span>{new Date(exam.created_at).toLocaleDateString()}</span>
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full no-print">
                                    <Printer className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 container max-w-5xl mx-auto px-6 py-12">
                        <PracticeExamContent exam={exam as any} />

                        {/* Action Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-slate-200 dark:border-slate-800 mt-12">
                            <div className="text-center sm:text-left">
                                <h4 className="text-sm font-bold mb-1">Preparação para Concursos?</h4>
                                <p className="text-xs text-slate-500">Peça ao Odonto Practice para gerar mais questões de {exam.topic}.</p>
                            </div>
                            <div className="flex gap-3">
                                <Link href={`/dashboard/chat?agent=odonto-practice&topic=${exam.topic}`}>
                                    <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 text-xs h-10 font-bold shadow-lg shadow-violet-500/10">
                                        Novo Simulado Deste Tema
                                    </Button>
                                </Link>
                                <Button variant="outline" className="rounded-full px-6 text-xs h-10 font-bold border-slate-200 dark:border-slate-800">
                                    <Download className="w-3.5 h-3.5 mr-2" />
                                    Exportar Gabarito
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </ArtifactPageLayout>
        </div>
    )
}
