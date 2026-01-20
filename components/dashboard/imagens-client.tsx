"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Image as ImageIcon, Calendar, FileText, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import { VisionWorkspace } from "@/components/dashboard/vision-workspace"
import type { ArtifactResult } from "@/components/chat/types"

interface ImageArtifact {
    id: string
    title: string
    image_url?: string
    analysis?: string
    findings?: string[]
    recommendations?: string[]
    created_at: string
}

interface ImagensClientProps {
    userId: string
    artifacts: ImageArtifact[] | null
}

export function ImagensClient({ userId, artifacts }: ImagensClientProps) {
    const router = useRouter()
    const [showWorkspace, setShowWorkspace] = useState(false)

    const handleArtifactCreated = (artifact: ArtifactResult) => {
        router.refresh()
    }

    if (showWorkspace) {
        return (
            <VisionWorkspace 
                userId={userId} 
                onClose={() => setShowWorkspace(false)}
                onArtifactCreated={() => {
                    router.refresh()
                    // Optional: maybe show toast "Saved"
                }}
            />
        )
    }

    return (
        <ArtifactPageLayout
            agentId="odonto-vision"
            userId={userId}
            onArtifactCreated={handleArtifactCreated}
        >
            <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Análise de Imagens
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Laudos e análises radiográficas gerados pelo Odonto Vision.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={() => setShowWorkspace(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Análise
                    </Button>
                </div>

                {artifacts && artifacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Analysis Card (First item) */}
                         <div 
                            onClick={() => setShowWorkspace(true)}
                            className="group relative flex flex-col items-center justify-center h-full min-h-[300px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500/50 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all cursor-pointer"
                        >
                            <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nova Análise</h3>
                            <p className="text-sm text-slate-500 text-center max-w-[200px] mt-2">
                                Inicie uma nova análise radiográfica com IA
                            </p>
                        </div>

                        {artifacts.map((artifact) => (
                            <Link key={artifact.id} href={`/dashboard/imagens/${artifact.id}`} className="block group">
                                <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-500 group-hover:-translate-y-1 overflow-hidden">
                                    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                        {artifact.image_url ? (
                                            <img
                                                src={artifact.image_url}
                                                alt={artifact.title}
                                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="w-12 h-12 text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="outline" className="bg-orange-500/90 text-white border-none backdrop-blur-md">
                                                Análise
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                Odonto Vision
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-1 text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                            {artifact.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                            {artifact.analysis?.substring(0, 100)}...
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center justify-between">
                                        <div className="flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                                            <FileText className="w-3 h-3" />
                                            <span>{artifact.findings?.length || 0} achados</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(artifact.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center min-h-[400px]">
                        {/* Empty state content */}
                        <div className="text-center space-y-4 max-w-lg mx-auto">
                            <div className="mx-auto w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6 animate-pulse">
                                <ImageIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Comece sua primeira análise
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                O Odonto Vision utiliza IA avançada para analisar radiografias, identificar patologias e sugerir diagnósticos em segundos.
                            </p>
                            <Button 
                                onClick={() => setShowWorkspace(true)}
                                size="lg"
                                className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-xl shadow-orange-500/20 rounded-full px-8 h-12"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Iniciar Análise Agora
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </ArtifactPageLayout>
    )
}
