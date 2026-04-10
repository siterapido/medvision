"use client"

import { useCopilotReadable } from "@copilotkit/react-core"
import { cn } from "@/lib/utils"
import { Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Sparkles, Quote, Info } from "lucide-react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "@/components/agno-chat/markdown-components"

interface ImageContentProps {
    artifact: {
        id: string
        title: string
        analysis: string
        image_url?: string
        findings?: string[]
        recommendations?: string[]
        metadata?: any
    }
}

export function ImageContent({ artifact }: ImageContentProps) {
    // Expose artifact content to AI
    useCopilotReadable({
        description: `O usuário está analisando laudo radiográfico intitulado "${artifact.title}".`,
        value: {
            title: artifact.title,
            analysis: artifact.analysis,
            findings: artifact.findings,
            recommendations: artifact.recommendations,
            image_url: artifact.image_url,
            metadata: artifact.metadata
        }
    })

    return (
        <div className="flex flex-col gap-8">
            {/* Image Preview Hero */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl group">
                <div className="aspect-[21/9] w-full relative overflow-hidden flex items-center justify-center bg-black/40">
                    {artifact.image_url ? (
                        <img
                            src={artifact.image_url}
                            alt={artifact.title}
                            className="max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                            <ImageIcon className="w-16 h-16 opacity-20" />
                            <span className="text-sm font-medium">Imagem indisponível</span>
                        </div>
                    )}
                </div>

                {/* Overlay with Titling */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Med Vision Insight</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                        {artifact.title}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Analysis Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 opacity-50" />

                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <FileText className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Relatório Radiográfico</h3>
                        </div>

                        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none 
                            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                            prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-8
                            prose-li:text-slate-600 dark:prose-li:text-slate-300
                            prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
                            prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
                            prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                        ">
                            <MarkdownRenderer
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                            >
                                {artifact.analysis}
                            </MarkdownRenderer>
                        </div>

                        <div className="mt-12 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex gap-4">
                            <Info className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                            <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                Esta análise é fornecida por inteligência artificial e atua como um guia de suporte educacional. Não substitui o laudo clínico definitivo assinado por profissional habilitado.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Findings & Recommendations */}
                <div className="space-y-6">
                    {/* Findings Card */}
                    {artifact.findings && artifact.findings.length > 0 && (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                Achados Clínicos
                            </h4>

                            <ul className="space-y-4 relative z-10">
                                {artifact.findings.map((finding, idx) => (
                                    <li key={idx} className="flex gap-3 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors leading-snug">
                                            {finding}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations Card */}
                    {artifact.recommendations && artifact.recommendations.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-500/10 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-100 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                <CheckCircle2 className="w-4 h-4 text-indigo-300" />
                                Recomendações
                            </h4>

                            <ul className="space-y-4 relative z-10">
                                {artifact.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex gap-3 items-start group">
                                        <div className="w-5 h-5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                                            <span className="text-[10px] font-bold">{idx + 1}</span>
                                        </div>
                                        <span className="text-sm text-indigo-50/90 leading-snug">
                                            {rec}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
