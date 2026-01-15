
"use client"

import { useCopilotReadable } from "@copilotkit/react-core"
import { cn } from "@/lib/utils"
import { BookOpen, FileText, ExternalLink } from "lucide-react"

interface ResearchContentProps {
    research: {
        id: string
        title: string
        content: string
        query: string
        sources: { title: string; url: string }[]
        type: string
    }
}

export function ResearchContent({ research }: ResearchContentProps) {
    // Expose research content to AI
    useCopilotReadable({
        description: `O usuário está analisando a pesquisa científica intitulada "${research.title}" baseada na consulta "${research.query}".`,
        value: {
            title: research.title,
            query: research.query,
            content: research.content,
            sources: research.sources,
            type: research.type
        }
    })

    return (
        <div className="flex flex-col gap-10">
            {/* Query Insight */}
            <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Objetivo da Pesquisa</span>
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-200 italic font-medium leading-relaxed">
                    "{research.query}"
                </p>
            </div>

            {/* Scientific Content */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 md:p-12">
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-h1:text-4xl prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed">
                    <div className="whitespace-pre-wrap font-sans">
                        {research.content}
                    </div>
                </div>
            </div>

            {/* Sources & References */}
            {research.sources && research.sources.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-cyan-500" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Literatura de Suporte</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {research.sources.map((source, idx) => (
                            <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {source.title || "Artigo Científico"}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">
                                            Link Externo • PubMed/Scientific Database
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-cyan-500 text-slate-400 group-hover:text-white transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
