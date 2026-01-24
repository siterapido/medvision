'use client'

import type { Artifact } from './types'
import { CodeArtifact } from './code-artifact'
import { ImageArtifact } from './image-artifact'
import { TableArtifact } from './table-artifact'
import { SummaryArtifact } from './summary-artifact'
import { FlashcardArtifact } from './flashcard-artifact'
import { QuizArtifact } from './quiz-artifact'
import { ResearchArtifact } from './research-artifact'
import { ReportArtifact } from './report-artifact'
import { MermaidDiagram } from './mermaid-diagram'
import { CodeExecutor } from './code-executor'
import { TextEditor } from './text-editor'
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
      return (
        <div className="space-y-4">
          <CodeArtifact artifact={artifact} className={className} />
          {(artifact.language === 'javascript' || artifact.language === 'js' || artifact.language === 'python' || artifact.language === 'py') && (
            <CodeExecutor code={artifact.code} language={artifact.language} />
          )}
        </div>
      )

    case 'image':
      return <ImageArtifact artifact={artifact} className={className} />

    case 'table':
      return <TableArtifact artifact={artifact} className={className} />

    case 'summary':
      return <SummaryArtifact artifact={artifact} className={className} />

    case 'flashcard':
      return <FlashcardArtifact artifact={artifact} className={className} />

    case 'quiz':
      return <QuizArtifact artifact={artifact} className={className} />

    case 'research':
      return <ResearchArtifact artifact={artifact} className={className} />

    case 'report':
      return <ReportArtifact artifact={artifact} className={className} />

    case 'text':
      return (
        <TextEditor 
          id={artifact.id} 
          initialContent={artifact.content} 
          title={artifact.title} 
          format={artifact.format} 
          className={className} 
        />
      )

    case 'document':
      return (
        <TextEditor 
          id={artifact.id} 
          initialContent={artifact.content} 
          title={artifact.title} 
          format="markdown" 
          className={className} 
        />
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
            <span className="text-sm font-medium">{artifact.title || 'Gráfico'}</span>
            <span className="text-xs text-muted-foreground">
              ({artifact.chartType})
            </span>
          </div>
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">
              Visualização de gráfico disponível em breve
            </p>
          </div>
        </div>
      )

    case 'diagram':
      return (
        <div className="space-y-4">
          {artifact.mermaidCode && (
            <MermaidDiagram code={artifact.mermaidCode} title={artifact.title} />
          )}
          {artifact.svgContent && (
            <div
              className={cn(
                'rounded-lg border border-border bg-card p-4 overflow-auto',
                'shadow-sm',
                className
              )}
              dangerouslySetInnerHTML={{ __html: artifact.svgContent }}
            />
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
              Tipo de artefato não suportado: {(artifact as Artifact).kind}
            </span>
          </div>
        </div>
      )
  }
}
