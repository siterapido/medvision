'use client'

import { cn } from '@/lib/utils'
import { FileText, Copy, Check, Download, List } from 'lucide-react'
import { useState } from 'react'
import type { SummaryArtifact as SummaryArtifactType } from './types'
import ReactMarkdown from 'react-markdown'

interface SummaryArtifactProps {
  artifact: SummaryArtifactType
  className?: string
}

export function SummaryArtifact({ artifact, className }: SummaryArtifactProps) {
  const [copied, setCopied] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(true)

  const copyContent = () => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsMarkdown = () => {
    let content = `# ${artifact.title || 'Resumo'}\n\n`
    
    if (artifact.keyPoints?.length) {
      content += `## Pontos-chave\n\n`
      artifact.keyPoints.forEach((point) => {
        content += `- ${point}\n`
      })
      content += '\n'
    }
    
    content += `## Conteudo\n\n${artifact.content}`
    
    if (artifact.source) {
      content += `\n\n---\n*Fonte: ${artifact.source}*`
    }

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title || 'resumo'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {artifact.title || 'Resumo'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {artifact.keyPoints?.length && (
            <button
              onClick={() => setShowKeyPoints(!showKeyPoints)}
              className={cn(
                'p-1.5 rounded-md text-muted-foreground',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors',
                showKeyPoints && 'bg-accent text-accent-foreground'
              )}
              title="Pontos-chave"
            >
              <List className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={copyContent}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Copiar"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={downloadAsMarkdown}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Baixar Markdown"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Points */}
      {artifact.keyPoints?.length && showKeyPoints && (
        <div className="px-4 py-3 bg-primary/5 border-b border-border">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            Pontos-chave
          </h4>
          <ul className="space-y-1">
            {artifact.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{artifact.content}</ReactMarkdown>
      </div>

      {/* Source */}
      {artifact.source && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Fonte: {artifact.source}
          </p>
        </div>
      )}
    </div>
  )
}
