'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { artifactVersionService, type VersionHistoryItem } from '@/lib/artifacts/version-service'
import { useArtifact } from '@/lib/contexts/artifact-context'
import { toast } from 'sonner'

/**
 * Hook for managing artifact version history and undo/redo
 */
export function useArtifactHistory(artifactId?: string) {
  const { currentArtifact, setArtifact } = useArtifact()
  const [history, setHistory] = useState<VersionHistoryItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const id = artifactId || currentArtifact?.id

  // Load history when artifact changes
  useEffect(() => {
    if (!id) {
      setHistory([])
      setCurrentIndex(-1)
      return
    }

    async function loadHistory() {
      setIsLoading(true)
      try {
        const items = await artifactVersionService.getHistory(id!)
        setHistory(items)
        setCurrentIndex(0) // Latest version is always first in the returned list
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [id])

  const canUndo = useMemo(() => currentIndex < history.length - 1, [currentIndex, history])
  const canRedo = useMemo(() => currentIndex > 0, [currentIndex])

  const undo = useCallback(async () => {
    if (!canUndo) return

    const prevVersion = history[currentIndex + 1]
    setIsLoading(true)
    try {
      const content = await artifactVersionService.getVersionContent(prevVersion.version_id)
      if (content && currentArtifact) {
        setArtifact({
          ...currentArtifact,
          ...content,
        } as any)
        setCurrentIndex(prevIndex => prevIndex + 1)
        toast.success(`Restaurado para versão ${prevVersion.version_number}`)
      }
    } catch (err) {
      toast.error('Erro ao desfazer alteração')
    } finally {
      setIsLoading(false)
    }
  }, [canUndo, history, currentIndex, currentArtifact, setArtifact])

  const redo = useCallback(async () => {
    if (!canRedo) return

    const nextVersion = history[currentIndex - 1]
    setIsLoading(true)
    try {
      const content = await artifactVersionService.getVersionContent(nextVersion.version_id)
      if (content && currentArtifact) {
        setArtifact({
          ...currentArtifact,
          ...content,
        } as any)
        setCurrentIndex(prevIndex => prevIndex - 1)
        toast.success(`Redesenhou para versão ${nextVersion.version_number}`)
      }
    } catch (err) {
      toast.error('Erro ao refazer alteração')
    } finally {
      setIsLoading(false)
    }
  }, [canRedo, history, currentIndex, currentArtifact, setArtifact])

  const restore = useCallback(async (versionId: string) => {
    setIsLoading(true)
    try {
      const resultId = await artifactVersionService.restoreVersion(versionId)
      if (resultId) {
        // Refresh history
        const items = await artifactVersionService.getHistory(resultId)
        setHistory(items)
        setCurrentIndex(0)
        
        // Update current artifact content
        const content = await artifactVersionService.getVersionContent(items[0].version_id)
        if (content && currentArtifact) {
          setArtifact({
            ...currentArtifact,
            ...content,
          } as any)
        }
        
        toast.success('Versão restaurada com sucesso')
      }
    } catch (err) {
      toast.error('Erro ao restaurar versão')
    } finally {
      setIsLoading(false)
    }
  }, [currentArtifact, setArtifact])

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    restore,
    isLoading,
    currentVersion: history[currentIndex],
  }
}
