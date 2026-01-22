'use client'

import type { Artifact } from './types'
import { CodeArtifact } from './code-artifact'
import { ImageArtifact } from './image-artifact'
import { TableArtifact } from './table-artifact'
import { SummaryArtifact } from './summary-artifact'
import { FlashcardArtifact } from './flashcard-artifact'
import { cn } from '@/lib/utils'
import { FileText, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ArtifactRendererProps {
  artifact: Artifact
  className?: string
}

export function ArtifactRenderer({ artifact, className }: ArtifactRendererProps) {
  switch (artifact.kind) {
    case 'code':
      return <CodeArtifact artifact={artifact} className={className} />

    case 'image':
      return <ImageArtifact artifact={artifact} className={className} />

    case 'table':
      return <TableArtifact artifact={artifact} className={className} />

    case 'summary':
      return <SummaryArtifact artifact={artifact} className={className} />

    case 'flashcard':
      return <FlashcardArtifact artifact={artifact} className={className} />

    case 'text':
      return (
        <div
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            'shadow-sm',
            className
          )}
        >
          {artifact.title && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{artifact.title}</span>
            </div>
          )}
          {artifact.format === 'markdown' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{artifact.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{artifact.content}</p>
          )}
        </div>
      )

    case 'document':
      return (
        <div
          className={cn(
            'rounded-lg border border-border bg-card overflow-hidden',
            'shadow-sm',
            className
          )}
        >
          {artifact.title && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{artifact.title}</span>
            </div>
          )}
          <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{artifact.content}</ReactMarkdown>
            {artifact.sections?.map((section, index) => (
              <div key={index} className="mt-4">
                <h3>{section.title}</h3>
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      )

    case 'chart':
      // Placeholder for chart - would need a charting library like recharts
      return (
        <div
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            'shadow-sm',
            className
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">{artifact.title || 'Grafico'}</span>
            <span className="text-xs text-muted-foreground">
              ({artifact.chartType})
            </span>
          </div>
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">
              Visualizacao de grafico disponivel em breve
            </p>
          </div>
        </div>
      )

    case 'diagram':
      return (
        <div
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            'shadow-sm',
            className
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">{artifact.title || 'Diagrama'}</span>
            <span className="text-xs text-muted-foreground">
              ({artifact.diagramType})
            </span>
          </div>
          {artifact.svgContent ? (
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: artifact.svgContent }}
            />
          ) : artifact.mermaidCode ? (
            <pre className="p-3 bg-muted/30 rounded-md text-sm overflow-x-auto">
              <code>{artifact.mermaidCode}</code>
            </pre>
          ) : (
            <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground">
                Nenhum conteudo de diagrama disponivel
              </p>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div
          className={cn(
            'rounded-lg border border-destructive/50 bg-destructive/5 p-4',
            className
          )}
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Tipo de artefato nao suportado: {(artifact as Artifact).kind}
            </span>
          </div>
        </div>
      )
  }
}
