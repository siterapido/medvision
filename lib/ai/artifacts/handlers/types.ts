/**
 * Document Handler Types
 *
 * Unified interface for handling different artifact/document types
 * in the createDocument and updateDocument tools.
 */

import { z } from 'zod'

/**
 * All supported document kinds
 */
export const DocumentKinds = [
  'summary',
  'flashcards',
  'quiz',
  'research',
  'report',
  'code',
  'text',
  'diagram',
] as const

export type DocumentKind = (typeof DocumentKinds)[number]

/**
 * Base document structure shared by all kinds
 */
export interface BaseDocument {
  id: string
  kind: DocumentKind
  title: string
  createdAt: string
  updatedAt?: string
}

/**
 * Database record structure for persistence
 */
export interface ArtifactDBRecord {
  id: string
  user_id: string
  title: string
  type: DocumentKind
  content: Record<string, unknown>
  description: string
  ai_context: {
    agent: string
    sessionId?: string
    model?: string
  }
  metadata: Record<string, unknown>
}

/**
 * Context available during document creation/update
 */
export interface DocumentHandlerContext {
  userId: string
  sessionId?: string
  agentId?: string
}

/**
 * Document handler interface
 *
 * Each document kind implements this interface to handle
 * creation, validation, and persistence.
 */
export interface DocumentHandler<TParams, TDocument extends BaseDocument> {
  /** The kind of document this handler creates */
  kind: DocumentKind

  /** Zod schema for validating creation parameters */
  schema: z.ZodType<TParams>

  /** Create a document from parameters */
  create(params: TParams, id: string): TDocument

  /** Convert document to database record format */
  toPersistenceRecord(
    document: TDocument,
    context: DocumentHandlerContext
  ): Omit<ArtifactDBRecord, 'id'>

  /** Generate a description for the document */
  getDescription(document: TDocument): string
}

/**
 * Registry of all document handlers
 */
export type DocumentHandlerRegistry = {
  [K in DocumentKind]: DocumentHandler<unknown, BaseDocument>
}

// =====================================
// Document-specific types
// =====================================

/**
 * Summary document
 */
export interface SummaryDocument extends BaseDocument {
  kind: 'summary'
  topic: string
  content: string
  keyPoints: string[]
  tags?: string[]
}

export interface SummaryParams {
  title: string
  topic: string
  content: string
  keyPoints: string[]
  tags?: string[]
}

/**
 * Flashcards document
 */
export interface FlashcardCard {
  id: string
  front: string
  back: string
  category?: string
}

export interface FlashcardsDocument extends BaseDocument {
  kind: 'flashcards'
  topic: string
  cards: FlashcardCard[]
  tags?: string[]
}

export interface FlashcardsParams {
  title: string
  topic: string
  cards: Array<{
    front: string
    back: string
    category?: string
  }>
  tags?: string[]
}

/**
 * Quiz document
 */
export interface QuizQuestion {
  id: string
  text: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizDocument extends BaseDocument {
  kind: 'quiz'
  topic: string
  questions: QuizQuestion[]
  specialty?: string
  tags?: string[]
}

export interface QuizParams {
  title: string
  topic: string
  questions: Array<{
    text: string
    options: Array<{
      text: string
      isCorrect: boolean
    }>
    explanation: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
  specialty?: string
  tags?: string[]
}

/**
 * Research document
 */
export interface ResearchSource {
  title: string
  url: string
  summary?: string
  authors?: string
  pubdate?: string
}

export interface ResearchDocument extends BaseDocument {
  kind: 'research'
  query: string
  content: string
  sources: ResearchSource[]
  methodology?: string
  tags?: string[]
}

export interface ResearchParams {
  title: string
  query: string
  content: string
  sources: ResearchSource[]
  methodology?: string
  tags?: string[]
}

/**
 * Report document (laudo)
 */
export interface ReportDocument extends BaseDocument {
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
  tags?: string[]
}

export interface ReportParams {
  title: string
  examType: string
  content: string
  findings: string[]
  recommendations: string[]
  imageUrl?: string
  quality?: {
    rating: 'good' | 'adequate' | 'limited'
    notes?: string
  }
  tags?: string[]
}

/**
 * Code document (NEW)
 */
export interface CodeDocument extends BaseDocument {
  kind: 'code'
  language: string
  code: string
  filename?: string
  description?: string
  tags?: string[]
}

export interface CodeParams {
  title: string
  language: string
  code: string
  filename?: string
  description?: string
  tags?: string[]
}

/**
 * Text/Markdown document (NEW)
 */
export interface TextDocument extends BaseDocument {
  kind: 'text'
  content: string
  format: 'plain' | 'markdown' | 'html'
  tags?: string[]
}

export interface TextParams {
  title: string
  content: string
  format?: 'plain' | 'markdown' | 'html'
  tags?: string[]
}

/**
 * Diagram document (NEW)
 */
export interface DiagramDocument extends BaseDocument {
  kind: 'diagram'
  diagramType: 'flowchart' | 'sequence' | 'mindmap' | 'anatomy' | 'mermaid'
  mermaidCode?: string
  svgContent?: string
  description?: string
  tags?: string[]
}

export interface DiagramParams {
  title: string
  diagramType: 'flowchart' | 'sequence' | 'mindmap' | 'anatomy' | 'mermaid'
  mermaidCode?: string
  svgContent?: string
  description?: string
  tags?: string[]
}

/**
 * Union type of all documents
 */
export type Document =
  | SummaryDocument
  | FlashcardsDocument
  | QuizDocument
  | ResearchDocument
  | ReportDocument
  | CodeDocument
  | TextDocument
  | DiagramDocument

/**
 * Union type of all params
 */
export type DocumentParams =
  | ({ kind: 'summary' } & SummaryParams)
  | ({ kind: 'flashcards' } & FlashcardsParams)
  | ({ kind: 'quiz' } & QuizParams)
  | ({ kind: 'research' } & ResearchParams)
  | ({ kind: 'report' } & ReportParams)
  | ({ kind: 'code' } & CodeParams)
  | ({ kind: 'text' } & TextParams)
  | ({ kind: 'diagram' } & DiagramParams)
