
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, FileText, Tag, Calendar, Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SummaryContent } from "@/components/artifacts/summary-content"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SummaryDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: summary, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !summary) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <ArtifactPageLayout
                agentId="odonto-summary"
                userId={user.id}
            >
                <div className="flex flex-col min-h-full">
                    {/* Top Navigation */}
                    <div className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <Link href="/dashboard/resumos">
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                                        {summary.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <FileText className="w-3 h-3 text-blue-500" />
                                        <span>{summary.topic || "Resumo"}</span>
                                    </div>
                                </div>
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
                        <div className="flex flex-col gap-8">
                            {/* Summary Header */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {summary.tags && summary.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors border-blue-100 dark:border-blue-900/30">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(summary.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Content Paper */}
                            <SummaryContent summary={summary} />

                            {/* Action Footer */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                                <div className="text-center sm:text-left">
                                    <h4 className="text-sm font-bold mb-1">Deseja aprofundar este tema?</h4>
                                    <p className="text-xs text-slate-500">Peça ao Prof. Estudo para criar questões baseadas neste resumo.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/dashboard/chat?agent=odonto-practice">
                                        <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full px-6 text-xs h-10 font-bold shadow-lg shadow-black/5">
                                            Praticar com este resumo
                                        </Button>
                                    </Link>
                                    <Button variant="outline" className="rounded-full px-6 text-xs h-10 font-bold border-slate-200 dark:border-slate-800">
                                        <Download className="w-3.5 h-3.5 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ArtifactPageLayout>
        </div>
    )
}
