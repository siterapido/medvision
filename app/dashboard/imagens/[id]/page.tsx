
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, Scan, Download, Calendar, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageAnalysisContent } from "@/components/artifacts/image-analysis-content"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ImageAnalysisDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: analysis, error } = await supabase
        .from("image_artifacts")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !analysis) {
        notFound()
    }

    return (
        <div className="bg-[#0F192F] text-slate-200 min-h-screen flex flex-col">
            {/* AG-UI Hero Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[800px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
                <div className="absolute bottom-0 left-[-10%] w-[600px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
            </div>

            <ArtifactPageLayout
                agentId="odonto-vision"
                userId={user.id}
                context={{
                    analysisId: analysis.id,
                    title: analysis.title,
                    type: "image_analysis"
                }}
            >
                <div className="flex flex-col min-h-full">
                    {/* Top Navigation / Header */}
                    <div className="sticky top-0 z-40 border-b border-slate-800/50 bg-[#0F192F]/80 backdrop-blur-xl">
                        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-semibold truncate text-slate-100 max-w-[200px] sm:max-w-md">
                                            {analysis.title}
                                        </h1>
                                        <Badge variant="outline" className="hidden sm:flex border-cyan-500/30 text-cyan-400 bg-cyan-500/5 text-[10px] uppercase tracking-wider h-5 px-2">
                                            <Scan className="w-2.5 h-2.5 mr-1" />
                                            Vision AI
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <Calendar className="w-3 h-3 text-cyan-500" />
                                        <span>{new Date(analysis.created_at || analysis.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800 no-print hidden sm:flex">
                                    <Printer className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800 hidden sm:flex">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 container max-w-5xl mx-auto px-6 py-12 relative z-10">

                        {/* Content Component */}
                        <ImageAnalysisContent analysis={analysis as any} />

                        {/* Footer Action Bar */}
                        <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center sm:text-left">
                                <h4 className="text-sm font-bold text-slate-200 mb-1">Dúvidas sobre o laudo?</h4>
                                <p className="text-xs text-slate-500">O Odonto Vision pode explicar detalhes técnicos e diagnósticos diferenciais.</p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all hover:border-slate-600">
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar PDF (Laudo)
                                </Button>

                                <Link href={`/dashboard/chat?context=${analysis.id}&type=image`} className="group">
                                    <Button className="rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-all border-0">
                                        <Scan className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                        Discutir Achados com IA
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </ArtifactPageLayout>
        </div>
    )
}
