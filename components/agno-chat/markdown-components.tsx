"use client"

import React, { memo } from "react"
import Link from "next/link"
import { ExternalLink, Check, Copy } from "lucide-react"
import { CodeBlock } from "@/components/ai-elements/code-block"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Link Component
export const MarkdownLink = ({ href, children }: any) => {
    const isExternal = href?.startsWith("http");
    const isInternal = href?.startsWith("/");

    if (isInternal) {
        return (
            <Link
                href={href}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 transition-colors font-medium inline-flex items-center gap-0.5"
            >
                {children}
            </Link>
        )
    }

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 transition-colors font-medium inline-flex items-center gap-0.5"
            >
                {children}
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
        )
    }

    return <a href={href} className="text-cyan-400 hover:text-cyan-300">{children}</a>
}

// Code Component
export const MarkdownCode = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = (match && match[1]) || "";

    if (!inline && language) {
        // Remove trailing newline if present
        const code = String(children).replace(/\n$/, "");
        return (
            <div className="my-4 rounded-lg overflow-hidden border border-slate-700/50 shadow-lg relative group">
                {/* 
                  Using the existing CodeBlock from ai-elements.
                  Note: CodeBlock expects 'language' type from 'shiki', passing string might need casting or validation 
                  but usually works if string matches bundled languages.
                */}
                <CodeBlock
                    code={code}
                    language={language as any}
                    className="border-0 bg-slate-950"
                />
            </div>
        )
    }

    return (
        <code
            className={cn(
                "px-1.5 py-0.5 rounded bg-slate-800/50 text-cyan-300 border border-slate-700/50 font-mono text-[0.9em]",
                className
            )}
            {...props}
        >
            {children}
        </code>
    )
}

// Headings
export const MarkdownH1 = ({ children }: any) => (
    <h1 className="text-2xl font-bold text-slate-100 mt-6 mb-4 pb-2 border-b border-slate-700/50 first:mt-0">
        {children}
    </h1>
)

export const MarkdownH2 = ({ children }: any) => (
    <h2 className="text-xl font-bold text-slate-100 mt-5 mb-3 first:mt-0">
        {children}
    </h2>
)

export const MarkdownH3 = ({ children }: any) => (
    <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">
        {children}
    </h3>
)

// Lists
export const MarkdownUl = ({ children }: any) => (
    <ul className="list-disc leading-7 my-4 ml-6 space-y-1 marker:text-cyan-500/50">
        {children}
    </ul>
)

export const MarkdownOl = ({ children }: any) => (
    <ol className="list-decimal leading-7 my-4 ml-6 space-y-1 marker:text-cyan-500/50 marker:font-medium">
        {children}
    </ol>
)

export const MarkdownLi = ({ children }: any) => (
    <li className="pl-1 relative">
        {children}
    </li>
)

// Blockquote
export const MarkdownBlockquote = ({ children }: any) => (
    <blockquote className="border-l-4 border-cyan-500/30 bg-slate-800/20 pl-4 py-2 my-4 italic text-slate-400 rounded-r-lg">
        {children}
    </blockquote>
)

// Table
export const MarkdownTable = ({ children }: any) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full text-sm text-left">
            {children}
        </table>
    </div>
)

export const MarkdownThead = ({ children }: any) => (
    <thead className="bg-slate-800/50 text-slate-200 font-semibold border-b border-slate-700/50">
        {children}
    </thead>
)

export const MarkdownTh = ({ children }: any) => (
    <th className="px-4 py-3 whitespace-nowrap">
        {children}
    </th>
)

export const MarkdownTr = ({ children }: any) => (
    <tr className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors">
        {children}
    </tr>
)

export const MarkdownTd = ({ children }: any) => (
    <td className="px-4 py-3 text-slate-300">
        {children}
    </td>
)

export const MarkdownVr = () => <hr className="my-6 border-slate-700/50" />

export const MarkdownComponents = {
    a: MarkdownLink,
    code: MarkdownCode,
    h1: MarkdownH1,
    h2: MarkdownH2,
    h3: MarkdownH3,
    ul: MarkdownUl,
    ol: MarkdownOl,
    li: MarkdownLi,
    blockquote: MarkdownBlockquote,
    table: MarkdownTable,
    thead: MarkdownThead,
    th: MarkdownTh,
    tr: MarkdownTr,
    td: MarkdownTd,
    hr: MarkdownVr,
    p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-7 text-slate-300">{children}</p>,
}
