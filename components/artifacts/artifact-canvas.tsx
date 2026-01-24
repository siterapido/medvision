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

function renderArtifact(artifact: Artifact, _onSave?: () => void, _onShare?: () => void) {
  // Convert from lib/artifacts/definitions.ts Artifact to components/artifacts/types.ts format
  switch (artifact.type) {
    case 'summary':
      return (
        <SummaryArtifact
          artifact={{
            id: artifact.id,
            kind: 'summary',
            title: artifact.title,
            content: artifact.content,
            keyPoints: artifact.keyPoints,
            topic: artifact.topic,
            tags: artifact.tags,
          }}
        />
      )
    case 'flashcards':
      return (
        <FlashcardArtifact
          artifact={{
            id: artifact.id,
            kind: 'flashcard',
            title: artifact.title,
            cards: artifact.cards,
            topic: artifact.topic,
          }}
        />
      )
    case 'quiz':
      return (
        <QuizArtifact
          artifact={{
            id: artifact.id,
            kind: 'quiz',
            title: artifact.title,
            topic: artifact.topic,
            specialty: artifact.specialty,
            questions: artifact.questions,
          }}
        />
      )
    case 'research':
      return (
        <ResearchArtifact
          artifact={{
            id: artifact.id,
            kind: 'research',
            title: artifact.title,
            query: artifact.query,
            content: artifact.content,
            sources: artifact.sources,
            methodology: artifact.methodology,
          }}
        />
      )
    case 'report':
      return (
        <ReportArtifact
          artifact={{
            id: artifact.id,
            kind: 'report',
            title: artifact.title,
            examType: artifact.examType,
            content: artifact.content,
            findings: artifact.findings,
            recommendations: artifact.recommendations,
            imageUrl: artifact.imageUrl,
            quality: artifact.quality,
          }}
        />
      )
    default:
      return <div className="p-4 text-muted-foreground">Artifact não suportado</div>
  }
}
