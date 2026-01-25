/**
 * Document Handlers Registry
 *
 * Implements DocumentHandler for each document kind.
 * Used by createDocument and updateDocument tools.
 */

import { nanoid } from 'nanoid'
import type { DocumentKind } from './types'

// Import handlers from subdirectories
import { summaryHandler } from './summary'
import { flashcardsHandler } from './flashcards'
import { quizHandler } from './quiz'
import { researchHandler } from './research'
import { reportHandler } from './report'
import { codeHandler } from './code'
import { textHandler } from './text'
import { diagramHandler } from './diagram'

/**
 * Registry of all document handlers
 * All handlers enabled for full artifact support
 */
export const documentHandlers = {
  summary: summaryHandler,
  flashcards: flashcardsHandler,
  quiz: quizHandler,
  research: researchHandler,
  report: reportHandler,
  code: codeHandler,
  text: textHandler,
  diagram: diagramHandler,
} as const

/**
 * Get handler for a specific document kind
 */
export function getDocumentHandler(kind: DocumentKind) {
  // @ts-expect-error - handlers map is temporarily restricted
  const handler = documentHandlers[kind]
  if (!handler) {
    throw new Error(`No handler for document kind: ${kind}`)
  }
  return handler
}

/**
 * Generate a new document ID
 */
export function generateDocumentId(): string {
  return nanoid()
}

// Re-export types
export * from './types'
