/**
 * Artifact System Types
 * 
 * Sistema de artefatos inspirado no Vercel AI Chatbot para renderizar
 * componentes interativos no chat (codigo, imagens, graficos, etc.)
 */

export type ArtifactKind =
  | 'code'
  | 'image'
  | 'text'
  | 'chart'
  | 'table'
  | 'flashcard'
  | 'summary'
  | 'document'
  | 'diagram'
  | 'quiz'
  | 'research'
  | 'report'
  | 'vision'

export interface ArtifactBase {
  id: string
  kind: ArtifactKind
  title?: string
  description?: string
  topic?: string
  tags?: string[]
  createdAt?: Date
}

export interface CodeArtifact extends ArtifactBase {
  kind: 'code'
  language: string
  code: string
  filename?: string
  highlightLines?: number[]
}

export interface ImageArtifact extends ArtifactBase {
  kind: 'image'
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface TextArtifact extends ArtifactBase {
  kind: 'text'
  content: string
  format?: 'plain' | 'markdown' | 'html'
}

export interface ChartArtifact extends ArtifactBase {
  kind: 'chart'
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color?: string
    }[]
  }
}

export interface TableArtifact extends ArtifactBase {
  kind: 'table'
  headers: string[]
  rows: string[][]
}

export interface FlashcardArtifact extends ArtifactBase {
  kind: 'flashcard'
  cards: {
    id: string
    front: string
    back: string
    category?: string
  }[]
}

export interface SummaryArtifact extends ArtifactBase {
  kind: 'summary'
  content: string
  keyPoints?: string[]
  source?: string
}

export interface DocumentArtifact extends ArtifactBase {
  kind: 'document'
  content: string
  sections?: {
    title: string
    content: string
  }[]
}

export interface DiagramArtifact extends ArtifactBase {
  kind: 'diagram'
  diagramType: 'flowchart' | 'sequence' | 'mindmap' | 'anatomy'
  mermaidCode?: string
  svgContent?: string
}

export interface QuizArtifact extends ArtifactBase {
  kind: 'quiz'
  topic: string
  specialty?: string
  questions: {
    id: string
    text: string
    options: {
      id: string
      text: string
      isCorrect: boolean
    }[]
    explanation: string
    difficulty: 'easy' | 'medium' | 'hard'
  }[]
}

export interface ResearchArtifact extends ArtifactBase {
  kind: 'research'
  query: string
  content: string
  sources: {
    title: string
    url: string
    summary?: string
    authors?: string
    pubdate?: string
  }[]
  methodology?: string
}

export interface ReportArtifact extends ArtifactBase {
  kind: 'report'
  examType: string
  content: string
  findings: string[]
  recommendations: string[]
  imageUrl?: string
  quality?: {
    rating: 'good' | 'adequate' | 'limited'
    notes?: string
  }
}

export interface VisionArtifact extends ArtifactBase {
  kind: 'vision'
  imageBase64: string
  thumbnailBase64?: string
  analyzedAt: string
  analysis: {
    meta?: {
      imageType?: string
      quality?: string
      qualityScore?: number
    }
    detections?: {
      id: string
      label: string
      confidence: number
      severity: string
      toothNumber?: string
      cidCode?: string
      differentialDiagnosis?: string[]
      clinicalSignificance?: 'alta' | 'media' | 'baixa'
      recommendedActions?: string[]
      detailedDescription?: string
    }[]
    findings?: {
      type: string
      zone: string
      level: string
    }[]
    report?: {
      technicalAnalysis?: string
      detailedFindings?: string
      diagnosticHypothesis?: string
      recommendations?: string[]
      perToothBreakdown?: {
        tooth: string
        findings: string
        cidCode?: string
        severity?: string
      }[]
      differentialDiagnosis?: string
    }
    precision?: number
    clinicalAssessment?: string
  }
  refinements?: {
    regionBox: { ymin: number; xmin: number; ymax: number; xmax: number }
    regionImageBase64: string
    analysis: VisionArtifact['analysis']
    analyzedAt: string
  }[]
}

export type Artifact =
  | CodeArtifact
  | ImageArtifact
  | TextArtifact
  | ChartArtifact
  | TableArtifact
  | FlashcardArtifact
  | SummaryArtifact
  | DocumentArtifact
  | DiagramArtifact
  | QuizArtifact
  | ResearchArtifact
  | ReportArtifact
  | VisionArtifact

// Simple factory functions for each artifact type
export function createCodeArtifact(data: Omit<CodeArtifact, 'id' | 'createdAt' | 'kind'> & { id?: string }): CodeArtifact {
  return {
    ...data,
    kind: 'code',
    id: data.id || `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
}

export function createSummaryArtifact(data: Omit<SummaryArtifact, 'id' | 'createdAt' | 'kind'> & { id?: string }): SummaryArtifact {
  return {
    ...data,
    kind: 'summary',
    id: data.id || `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
}

export function createFlashcardArtifact(data: Omit<FlashcardArtifact, 'id' | 'createdAt' | 'kind'> & { id?: string }): FlashcardArtifact {
  return {
    ...data,
    kind: 'flashcard',
    id: data.id || `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
}

export function createTableArtifact(data: Omit<TableArtifact, 'id' | 'createdAt' | 'kind'> & { id?: string }): TableArtifact {
  return {
    ...data,
    kind: 'table',
    id: data.id || `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
}

export function createImageArtifact(data: Omit<ImageArtifact, 'id' | 'createdAt' | 'kind'> & { id?: string }): ImageArtifact {
  return {
    ...data,
    kind: 'image',
    id: data.id || `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
}

// Type guard functions
export function isCodeArtifact(artifact: Artifact): artifact is CodeArtifact {
  return artifact.kind === 'code'
}

export function isImageArtifact(artifact: Artifact): artifact is ImageArtifact {
  return artifact.kind === 'image'
}

export function isChartArtifact(artifact: Artifact): artifact is ChartArtifact {
  return artifact.kind === 'chart'
}

export function isTableArtifact(artifact: Artifact): artifact is TableArtifact {
  return artifact.kind === 'table'
}

export function isFlashcardArtifact(artifact: Artifact): artifact is FlashcardArtifact {
  return artifact.kind === 'flashcard'
}

export function isSummaryArtifact(artifact: Artifact): artifact is SummaryArtifact {
  return artifact.kind === 'summary'
}
