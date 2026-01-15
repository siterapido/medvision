
"use client"

import { useCopilotReadable } from "@copilotkit/react-core"
import { cn } from "@/lib/utils"

interface SummaryContentProps {
    summary: {
        id: string
        title: string
        content: string
        topic: string
        tags: string[]
    }
}

export function SummaryContent({ summary }: SummaryContentProps) {
    // Expose summary content to AI
    useCopilotReadable({
        description: `O usuário está lendo o resumo odontológico intitulado "${summary.title}" sobre o tema "${summary.topic}".`,
        value: {
            title: summary.title,
            topic: summary.topic,
            content: summary.content,
            tags: summary.tags
        }
    })

    return (
        <div
            id="summary-content"
            className={cn(
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden",
                "p-8 md:p-12 min-h-[500px]"
            )}
        >
            <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-h1:text-4xl prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed">
                {/* 
                  Simple fallback for markdown. 
                  In a real app, use react-markdown here.
                  For now we use whitespace-pre-wrap to preserve agent formatting.
                */}
                <div className="whitespace-pre-wrap font-sans">
                    {summary.content}
                </div>
            </div>
        </div>
    )
}
