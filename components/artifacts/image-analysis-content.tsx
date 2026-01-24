"use client"

import { useCopilotReadable } from "@copilotkit/react-core"
import { cn } from "@/lib/utils"
import { Scan, FileText, CheckCircle2, AlertTriangle, AlertOctagon, Quote, Sparkles, ZoomIn } from "lucide-react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "@/components/ui/markdown-components"
import { Badge } from "@/components/ui/badge"

interface ImageAnalysisContentProps {
    analysis: {
        id: string
        title: string
        analysis: string
        image_url: string
        findings: string[]
        recommendations: string[]
        metadata?: any
    }
}

export function ImageAnalysisContent({ analysis }: ImageAnalysisContentProps) {
    // Expose analysis content to AI
    useCopilotReadable({
        description: `O usuário está visualizando a análise da imagem intitulada "${analysis.title}".`,
        value: {
            title: analysis.title,
            imageUrl: analysis.image_url,
            fullAnalysis: analysis.analysis,
            findings: analysis.findings,
            recommendations: analysis.recommendations
        }
    })

    const hasFindings = analysis.findings && analysis.findings.length > 0
    const hasRecommendations = analysis.recommendations && analysis.recommendations.length > 0

    return (
        <div className="flex flex-col gap-8">
            {/* Image Preview Hero */}
            <div className="relative overflow-hidden bg-[#0F192F] dark:bg-black border border-slate-800 rounded-3xl p-1 shadow-2xl">
                <div className="relative rounded-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10" />
                    <img
                        src={analysis.image_url}
                        alt={analysis.title}
                        className="w-full h-auto max-h-[500px] object-contain bg-black/50 mx-auto"
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="border-cyan-500/50 bg-cyan-950/50 text-cyan-400 backdrop-blur-md">
                                <Scan className="w-3 h-3 mr-1" />
                                Análise Radiográfica
                            </Badge>
                            {analysis.metadata?.model && (
                                <Badge variant="outline" className="border-slate-700 bg-black/50 text-slate-400 backdrop-blur-md">
                                    AI Model: {analysis.metadata.model}
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white shadow-black/80 drop-shadow-lg">{analysis.title}</h2>
                    </div>
                </div>
            </div>

            {/* Main Analysis Content */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-50" />

                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <FileText className="w-5 h-5 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Laudo Radiográfico</h3>
                </div>

                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none 
                    prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-8
                    prose-li:text-slate-600 dark:prose-li:text-slate-300
                    prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
                    prose-code:text-cyan-600 dark:prose-code:text-cyan-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                ">
                    <MarkdownRenderer
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                    >
                        {analysis.analysis}
                    </MarkdownRenderer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Key Findings */}
                {hasFindings && (
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Achados Principais</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.findings.map((finding, idx) => (
                                <li key={idx} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{finding}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommendations */}
                {hasRecommendations && (
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recomendações Clínicas</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
