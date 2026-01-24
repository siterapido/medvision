'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { Artifact } from '@/components/artifacts/types'

interface ArtifactContextValue {
  /** Currently displayed artifact in the side panel */
  currentArtifact: Artifact | null
  /** Set the artifact to display in the side panel */
  setArtifact: (artifact: Artifact) => void
  /** Clear the current artifact and close the panel */
  clearArtifact: () => void
  /** Whether the artifact panel is open */
  isPanelOpen: boolean
  /** Toggle the panel open/closed */
  togglePanel: () => void
  /** Open the panel */
  openPanel: () => void
  /** Close the panel */
  closePanel: () => void
  /** All artifacts from the current conversation */
  artifacts: Artifact[]
  /** Add an artifact to the list */
  addArtifact: (artifact: Artifact) => void
  /** Clear all artifacts */
  clearAllArtifacts: () => void
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null)

interface ArtifactProviderProps {
  children: ReactNode
  /** Initial panel open state */
  defaultOpen?: boolean
}

export function ArtifactProvider({
  children,
  defaultOpen = false,
}: ArtifactProviderProps) {
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(defaultOpen)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])

  const setArtifact = useCallback((artifact: Artifact) => {
    setCurrentArtifact(artifact)
    setIsPanelOpen(true)
  }, [])

  const clearArtifact = useCallback(() => {
    setCurrentArtifact(null)
    setIsPanelOpen(false)
  }, [])

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev)
  }, [])

  const openPanel = useCallback(() => {
    setIsPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const addArtifact = useCallback((artifact: Artifact) => {
    setArtifacts((prev) => {
      // Check if artifact already exists (by id)
      const existingIndex = prev.findIndex((a) => a.id === artifact.id)
      if (existingIndex !== -1) {
        // Update existing artifact
        const updated = [...prev]
        updated[existingIndex] = artifact
        return updated
      }
      // Add new artifact
      return [...prev, artifact]
    })
  }, [])

  const clearAllArtifacts = useCallback(() => {
    setArtifacts([])
    setCurrentArtifact(null)
  }, [])

  const value = useMemo<ArtifactContextValue>(
    () => ({
      currentArtifact,
      setArtifact,
      clearArtifact,
      isPanelOpen,
      togglePanel,
      openPanel,
      closePanel,
      artifacts,
      addArtifact,
      clearAllArtifacts,
    }),
    [
      currentArtifact,
      setArtifact,
      clearArtifact,
      isPanelOpen,
      togglePanel,
      openPanel,
      closePanel,
      artifacts,
      addArtifact,
      clearAllArtifacts,
    ]
  )

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  )
}

export function useArtifact() {
  const context = useContext(ArtifactContext)
  if (!context) {
    throw new Error('useArtifact must be used within an ArtifactProvider')
  }
  return context
}

/**
 * Optional hook that returns null if outside provider
 * Useful for components that may or may not be within the provider
 */
export function useArtifactOptional() {
  return useContext(ArtifactContext)
}
