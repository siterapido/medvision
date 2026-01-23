'use client'

import { AnimatePresence, motion } from 'motion/react'
import { getAgentArtifactConfig } from '@/lib/ai/agents/artifact-mapping'
import type { Artifact } from '@/lib/artifacts/definitions'
import { SummaryArtifact } from './summary-artifact'
import { FlashcardArtifact } from './flashcard-artifact'
import { QuizArtifact } from './quiz-artifact'
import { ResearchArtifact } from './research-artifact'
import { ReportArtifact } from './report-artifact'

interface ArtifactCanvasProps {
  artifact: Artifact
  agentId: string
  onSave?: () => void
  onShare?: () => void
}

export function ArtifactCanvas({ artifact, agentId, onSave, onShare }: ArtifactCanvasProps) {
  const config = getAgentArtifactConfig(agentId)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={artifact.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 shadow-lg"
        style={{ '--artifact-color': config.color } as React.CSSProperties}
      >
        {/* Accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${config.color}80, ${config.color}20)` }}
        />

        {/* Content */}
        <div className="pt-2">
          {renderArtifact(artifact, onSave, onShare)}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function renderArtifact(artifact: Artifact, onSave?: () => void, onShare?: () => void) {
  switch (artifact.type) {
    case 'summary':
      return <SummaryArtifact data={artifact} onSave={onSave} onShare={onShare} />
    case 'flashcards':
      return <FlashcardArtifact data={artifact} onSave={onSave} onShare={onShare} />
    case 'quiz':
      return <QuizArtifact data={artifact} onSave={onSave} onShare={onShare} />
    case 'research':
      return <ResearchArtifact data={artifact} onSave={onSave} onShare={onShare} />
    case 'report':
      return <ReportArtifact data={artifact} onSave={onSave} onShare={onShare} />
    default:
      return <div className="p-4 text-muted-foreground">Artifact não suportado</div>
  }
}
