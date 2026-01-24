'use client'

import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtifactRenderer } from './artifact-renderer'
import { useArtifactOptional } from '@/lib/contexts/artifact-context'
import { cn } from '@/lib/utils'
import type { Artifact } from './types'

interface InteractiveArtifactProps {
  artifact: Artifact
  className?: string
  /** Whether to show the expand button (default: true) */
  expandable?: boolean
  /** Whether this is displayed in a compact/inline mode */
  compact?: boolean
}

/**
 * Interactive artifact wrapper that adds expand-to-panel functionality
 *
 * When used within an ArtifactProvider, clicking the expand button
 * will open the artifact in the side panel.
 *
 * When used outside the provider, it renders the artifact without
 * the expand button.
 */
export function InteractiveArtifact({
  artifact,
  className,
  expandable = true,
  compact = false,
}: InteractiveArtifactProps) {
  const artifactContext = useArtifactOptional()

  // If no context, render without expand button
  const canExpand = expandable && artifactContext !== null

  const handleExpand = () => {
    if (artifactContext) {
      artifactContext.setArtifact(artifact)
      artifactContext.addArtifact(artifact)
    }
  }

  return (
    <div className={cn('group relative', className)}>
      <ArtifactRenderer artifact={artifact} />

      {/* Expand button overlay */}
      {canExpand && (
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            'absolute right-2 top-2 h-7 w-7',
            'opacity-0 transition-opacity group-hover:opacity-100',
            'bg-background/80 backdrop-blur-sm',
            'shadow-sm hover:bg-background'
          )}
          onClick={handleExpand}
          title="Expandir no painel lateral"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

/**
 * Compact artifact preview for use in message thread
 * Shows a smaller version with title and expand button
 */
export function ArtifactPreview({
  artifact,
  className,
}: {
  artifact: Artifact
  className?: string
}) {
  const artifactContext = useArtifactOptional()

  const handleClick = () => {
    if (artifactContext) {
      artifactContext.setArtifact(artifact)
      artifactContext.addArtifact(artifact)
    }
  }

  // Display name mapping
  const kindLabels: Record<string, string> = {
    code: 'Codigo',
    image: 'Imagem',
    text: 'Texto',
    chart: 'Grafico',
    table: 'Tabela',
    flashcard: 'Flashcards',
    summary: 'Resumo',
    document: 'Documento',
    diagram: 'Diagrama',
    quiz: 'Quiz',
    research: 'Pesquisa',
    report: 'Laudo',
  }

  const kindLabel = kindLabels[artifact.kind] || artifact.kind

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3',
        'text-left transition-colors hover:bg-muted/50',
        'cursor-pointer',
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Maximize2 className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {kindLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm font-medium">
          {artifact.title || `${kindLabel} sem titulo`}
        </p>
      </div>
      <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
