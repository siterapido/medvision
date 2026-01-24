'use client'

import { X, Maximize2, Minimize2, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArtifactRenderer } from './artifact-renderer'
import { VersionHistory } from './version-history'
import { useArtifact } from '@/lib/contexts/artifact-context'
import { cn } from '@/lib/utils'
import { useState, useCallback, useMemo, type ReactNode } from 'react'
import type { ArtifactKind } from './types'

// Icon mapping for artifact kinds
const artifactKindIcons: Record<ArtifactKind, string> = {
  code: '{""}',
  image: '{}',
  text: '{""}',
  chart: '{""}',
  table: '{""}',
  flashcard: '{""}',
  summary: '{""}',
  document: '{""}',
  diagram: '{""}',
  quiz: '{""}',
  research: '{""}',
  report: '{""}',
}

// Display names for artifact kinds
const artifactKindLabels: Record<ArtifactKind, string> = {
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

interface ArtifactPanelProps {
  className?: string
  /** Callback when panel is collapsed/closed */
  onCollapse?: () => void
  /** Whether the panel can be collapsed (show collapse button) */
  collapsible?: boolean
  /** Custom header actions */
  headerActions?: React.ReactNode
}

export function ArtifactPanel({
  className,
  onCollapse,
  collapsible = true,
  headerActions,
}: ArtifactPanelProps) {
  const { currentArtifact, clearArtifact, artifacts, setArtifact } = useArtifact()
  const [isMaximized, setIsMaximized] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Find current artifact index in the list
  const currentIndex = useMemo(() => {
    if (!currentArtifact) return -1
    return artifacts.findIndex((a) => a.id === currentArtifact.id)
  }, [currentArtifact, artifacts])

  const hasMultipleArtifacts = artifacts.length > 1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < artifacts.length - 1

  const handleClose = useCallback(() => {
    clearArtifact()
    onCollapse?.()
  }, [clearArtifact, onCollapse])

  const handleToggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev)
  }, [])

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev)
  }, [])

  const handleNavigatePrev = useCallback(() => {
    if (canNavigatePrev && artifacts[currentIndex - 1]) {
      setArtifact(artifacts[currentIndex - 1])
    }
  }, [canNavigatePrev, artifacts, currentIndex, setArtifact])

  const handleNavigateNext = useCallback(() => {
    if (canNavigateNext && artifacts[currentIndex + 1]) {
      setArtifact(artifacts[currentIndex + 1])
    }
  }, [canNavigateNext, artifacts, currentIndex, setArtifact])

  // No artifact to display
  if (!currentArtifact) {
    return (
      <div
        className={cn(
          'flex h-full flex-col items-center justify-center bg-muted/20',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <div className="mb-2 text-4xl opacity-20">{"<}"}</div>
          <p className="text-sm">Nenhum artifact selecionado</p>
          <p className="mt-1 text-xs opacity-70">
            Clique em um artifact no chat para visualiza-lo aqui
          </p>
        </div>
      </div>
    )
  }

  const kindLabel = artifactKindLabels[currentArtifact.kind] || currentArtifact.kind

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-background',
        isMaximized && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b bg-muted/30 px-3">
        {/* Left side: kind badge and title */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {kindLabel}
          </span>
          <span className="truncate text-sm font-medium">
            {currentArtifact.title || 'Artifact'}
          </span>
          {hasMultipleArtifacts && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {currentIndex + 1}/{artifacts.length}
            </span>
          )}
        </div>

        {/* Right side: actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Navigation arrows */}
          {hasMultipleArtifacts && (
            <div className="mr-1 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canNavigatePrev}
                onClick={handleNavigatePrev}
                title="Artifact anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={!canNavigateNext}
                onClick={handleNavigateNext}
                title="Proximo artifact"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Custom header actions */}
          {headerActions}

          {/* History button */}
          <Button
            variant={showHistory ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleHistory}
            title="Historico de versoes"
          >
            <History className="h-4 w-4" />
          </Button>

          {/* Maximize/minimize */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleMaximize}
            title={isMaximized ? 'Minimizar' : 'Maximizar'}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          {/* Close/collapse */}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClose}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showHistory ? (
          <VersionHistory 
            artifactId={currentArtifact.id} 
            onClose={() => setShowHistory(false)} 
          />
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4">
              <ArtifactRenderer artifact={currentArtifact} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

/**
 * Empty state component for when no artifact is selected
 */
export function ArtifactPanelEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center bg-muted/10 p-8',
        className
      )}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <Maximize2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mb-1 font-medium text-foreground">
          Painel de Artifacts
        </h3>
        <p className="text-sm text-muted-foreground">
          Clique em um artifact no chat para visualiza-lo em tela cheia
        </p>
      </div>
    </div>
  )
}
