
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, ClipboardList, GraduationCap, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function QuestionariosPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch exams
    // Precisamos fazer um join ou fetch separado para contar questões se não tiver no main table
    // Por ora, vamos assumir que practice_exams tem o que precisamos ou faremos um count simples se der
    // Mas practice_question tem exam_id. Supabase select count é um pouco chato sem RPC.
    // Vamos apenas listar os exames.
    const { data: exams } = await supabase
        .from("practice_exams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        Meus Questionários
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Simulados e questões de prática gerados pelo Prof. Estudo.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/chat?agent=odonto-practice">
                        <Button className="rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Questionário
                        </Button>
                    </Link>
                </div>
            </div>

            {exams && exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="relative flex flex-col items-center justify-center min-h-[450px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Nenhum questionário encontrado
                        </h3>

                        <p className="text-muted-foreground mb-6">
                            Crie simulados personalizados para treinar seus conhecimentos com o Prof. Estudo.
                        </p>

                        <Link href="/dashboard/chat?agent=odonto-practice">
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Simulado
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
