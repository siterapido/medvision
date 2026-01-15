
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, Network, Layers, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MindMapViewer } from "@/components/artifacts/mind-map-viewer"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MindMapDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: map, error } = await supabase
        .from("mind_map_artifacts")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !map) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top Navigation */}
            <div className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link href="/dashboard/mindmaps">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                                {map.title}
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <Network className="w-3 h-3 text-pink-500" />
                                <span>{map.topic || "Geral"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4 hidden md:flex">
                        <Badge variant="outline" className="border-pink-200 dark:border-pink-900 flex gap-1 items-center">
                            <Sparkles className="w-3 h-3 text-pink-500" />
                            <span>Visualização Dinâmica</span>
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Share2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-8 flex flex-col gap-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-pink-500" />
                        <h2 className="text-lg font-bold">Mapa Conceitual</h2>
                    </div>
                    <p className="text-xs text-slate-500">Arraste os nós para reorganizar sua visão</p>
                </div>

                <MindMapViewer data={map.data as any} title={map.title} />

                {/* Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Contexto do Mapa</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Este mapa mental conecta os conceitos de <strong>{map.topic}</strong>.
                                Utilize esta visualização para entender as correlações entre diagnósticos, tratamentos e bases teóricas.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Ação Rápida</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                            <Link href={`/dashboard/chat?context=${map.id}&type=mindmap`} className="block">
                                <Button className="w-full text-xs h-9 bg-pink-600 hover:bg-pink-700">
                                    Explorar no Chat
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full text-xs h-9">
                                Exportar PDF
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
            variant === "outline" ? "bg-transparent" : "bg-slate-100",
            className
        )}>
            {children}
        </span>
    )
}

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
