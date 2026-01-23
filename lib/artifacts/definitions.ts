import { z } from 'zod'

// Base artifact schema
export const baseArtifactSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string().datetime(),
})

// Summary Artifact
export const summarySchema = baseArtifactSchema.extend({
  type: z.literal('summary'),
  content: z.string(),
  keyPoints: z.array(z.string()).default([]),
  topic: z.string().optional(),
  tags: z.array(z.string()).default([]),
})
export type SummaryArtifact = z.infer<typeof summarySchema>

// Flashcard Artifact
export const flashcardSchema = baseArtifactSchema.extend({
  type: z.literal('flashcards'),
  cards: z.array(z.object({
    id: z.string(),
    front: z.string(),
    back: z.string(),
    category: z.string().optional(),
  })),
  topic: z.string().optional(),
})
export type FlashcardArtifact = z.infer<typeof flashcardSchema>

// Quiz Artifact
export const quizQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})
export const quizSchema = baseArtifactSchema.extend({
  type: z.literal('quiz'),
  topic: z.string(),
  specialty: z.string().optional(),
  questions: z.array(quizQuestionSchema),
})
export type QuizArtifact = z.infer<typeof quizSchema>

// Research Artifact
export const researchSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
  authors: z.string().optional(),
  pubdate: z.string().optional(),
})
export const researchSchema = baseArtifactSchema.extend({
  type: z.literal('research'),
  query: z.string(),
  content: z.string(),
  sources: z.array(researchSourceSchema).default([]),
  methodology: z.string().optional(),
})
export type ResearchArtifact = z.infer<typeof researchSchema>

// Report Artifact (Laudo)
export const reportSchema = baseArtifactSchema.extend({
  type: z.literal('report'),
  examType: z.string(),
  content: z.string(),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  quality: z.object({
    rating: z.enum(['good', 'adequate', 'limited']),
    notes: z.string().optional(),
  }).optional(),
})
export type ReportArtifact = z.infer<typeof reportSchema>

// Union type for all artifacts
export const artifactSchema = z.discriminatedUnion('type', [
  summarySchema,
  flashcardSchema,
  quizSchema,
  researchSchema,
  reportSchema,
])
export type Artifact = z.infer<typeof artifactSchema>

// Artifact type enum
export type ArtifactType = Artifact['type']

// Type guards
export function isSummary(artifact: Artifact): artifact is SummaryArtifact {
  return artifact.type === 'summary'
}
export function isFlashcards(artifact: Artifact): artifact is FlashcardArtifact {
  return artifact.type === 'flashcards'
}
export function isQuiz(artifact: Artifact): artifact is QuizArtifact {
  return artifact.type === 'quiz'
}
export function isResearch(artifact: Artifact): artifact is ResearchArtifact {
  return artifact.type === 'research'
}
export function isReport(artifact: Artifact): artifact is ReportArtifact {
  return artifact.type === 'report'
}
