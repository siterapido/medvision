/**
 * Chat Artifact Renderer
 *
 * Re-exports the unified artifact system from components/artifacts
 * Maintains backward compatibility for any code importing from chat/
 */

// Re-export everything from the unified artifacts system
export {
  ArtifactRenderer,
  type Artifact,
  type ArtifactKind,
  type ArtifactBase,
  type CodeArtifact,
  type ImageArtifact,
  type TextArtifact,
  type ChartArtifact,
  type TableArtifact,
  type FlashcardArtifact,
  type SummaryArtifact,
  type DocumentArtifact,
  type DiagramArtifact,
  type QuizArtifact,
  type ResearchArtifact,
  type ReportArtifact,
} from '@/components/artifacts'

// Legacy type alias for backward compatibility
export type ArtifactType =
  | 'summary'
  | 'flashcards'
  | 'quiz'
  | 'research'
  | 'report'
  | 'code'
  | 'image'
  | 'table'
  | 'document'
  | 'diagram'
  | 'chart'
  | 'text'
