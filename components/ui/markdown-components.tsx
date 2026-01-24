"use client"

import { cn } from "@/lib/utils"
import type { Components } from "react-markdown"
import { ExternalLink } from "lucide-react"

/**
 * Componentes de Markdown customizados para renderização de conteúdo AI
 * Estilização consistente com o design system
 */
export const MarkdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold text-slate-100 mb-4 mt-6 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold text-slate-100 mb-3 mt-5 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-4 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-medium text-slate-200 mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="text-slate-300 leading-relaxed mb-3 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-1.5 mb-3 text-slate-300 ml-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside space-y-1.5 mb-3 text-slate-300 ml-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-slate-300 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
      {...props}
    >
      {children}
      <ExternalLink className="w-3 h-3 inline-block" />
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-slate-300" {...props}>
      {children}
    </em>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={cn("font-mono text-sm", className)} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-3 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-cyan-500 bg-slate-800/50 pl-4 py-2 my-3 italic text-slate-300 rounded-r"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="border-slate-700 my-6" {...props} />,
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-3">
      <table className="min-w-full border-collapse border border-slate-700 rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-slate-700" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-slate-800/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-200 border-b border-slate-700" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 text-sm text-slate-300" {...props}>
      {children}
    </td>
  ),
}
