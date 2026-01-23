'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, ExternalLink, Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResearchArtifact as ResearchArtifactType } from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ResearchArtifactProps {
  artifact: ResearchArtifactType
  className?: string
}

export function ResearchArtifact({ artifact, className }: ResearchArtifactProps) {
  const [copied, setCopied] = useState(false)
  const [showSources, setShowSources] = useState(true)

  const copyContent = () => {
    let content = `# ${artifact.title || 'Dossiê de Pesquisa'}\n\n`
    content += `**Pergunta de Pesquisa:** ${artifact.query}\n\n`
    content += artifact.content
    content += '\n\n## Fontes\n\n'
    artifact.sources.forEach((source, i) => {
      content += `${i + 1}. [${source.title}](${source.url})\n`
      if (source.summary) content += `   ${source.summary}\n`
    })

    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsMarkdown = () => {
    let content = `# ${artifact.title || 'Dossiê de Pesquisa'}\n\n`
    content += `**Pergunta de Pesquisa:** ${artifact.query}\n\n`
    if (artifact.methodology) {
      content += `**Metodologia:** ${artifact.methodology}\n\n`
    }
    content += '---\n\n'
    content += artifact.content
    content += '\n\n---\n\n## Referências\n\n'
    artifact.sources.forEach((source, i) => {
      content += `${i + 1}. **${source.title}**\n`
      content += `   - URL: ${source.url}\n`
      if (source.authors) content += `   - Autores: ${source.authors}\n`
      if (source.pubdate) content += `   - Data: ${source.pubdate}\n`
      if (source.summary) content += `   - Resumo: ${source.summary}\n`
      content += '\n'
    })

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title || 'dossie-pesquisa'}.md`
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
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-foreground">{artifact.title || 'Dossiê de Pesquisa'}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={copyContent}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadAsMarkdown}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Query */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pergunta de Pesquisa</p>
        <p className="text-sm font-medium text-foreground">{artifact.query}</p>
        {artifact.methodology && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {artifact.methodology}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
      </div>

      {/* Sources */}
      {artifact.sources?.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center justify-between w-full px-4 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              Fontes ({artifact.sources.length})
            </span>
            {showSources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showSources && (
            <div className="divide-y divide-border">
              {artifact.sources.map((source, index) => (
                <div key={index} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      {source.authors && (
                        <p className="text-xs text-muted-foreground mt-0.5">{source.authors}</p>
                      )}
                      {source.pubdate && (
                        <p className="text-xs text-muted-foreground">{source.pubdate}</p>
                      )}
                    </div>
                  </div>
                  {source.summary && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{source.summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
