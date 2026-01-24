/**
 * Schemas Zod tipados para o sistema de artefatos
 * Compatível com AI SDK v6
 */

import { z } from 'zod';

// Enum de estágios comum
export const ArtifactStageSchema = z.enum([
  'initializing',
  'generating',
  'processing',
  'validating',
  'complete',
  'error',
]);

export type ArtifactStage = z.infer<typeof ArtifactStageSchema>;

// Base schema para todos os artefatos
export const BaseArtifactSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  stage: ArtifactStageSchema.default('initializing'),
  progress: z.number().min(0).max(1).default(0),
  createdAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

// ========================================
// SUMMARY ARTIFACT
// ========================================
export const SummaryArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('summary'),
  topic: z.string(),
  content: z.string().default(''),
  keyPoints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  wordCount: z.number().default(0),
});

export type SummaryArtifact = z.infer<typeof SummaryArtifactSchema>;

// ========================================
// FLASHCARD ARTIFACT
// ========================================
export const FlashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const FlashcardArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('flashcard'),
  topic: z.string(),
  cards: z.array(FlashcardSchema).default([]),
  totalCards: z.number().default(0),
});

export type FlashcardArtifact = z.infer<typeof FlashcardArtifactSchema>;

// ========================================
// QUIZ ARTIFACT
// ========================================
export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(QuizOptionSchema),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const QuizArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('quiz'),
  topic: z.string(),
  specialty: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questions: z.array(QuizQuestionSchema).default([]),
  totalQuestions: z.number().default(0),
});

export type QuizArtifact = z.infer<typeof QuizArtifactSchema>;

// ========================================
// RESEARCH ARTIFACT
// ========================================
export const ResearchSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
  authors: z.string().optional(),
  pubdate: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
});

export const ResearchArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('research'),
  query: z.string(),
  content: z.string().default(''),
  sources: z.array(ResearchSourceSchema).default([]),
  methodology: z.string().optional(),
  sourcesCount: z.number().default(0),
});

export type ResearchArtifact = z.infer<typeof ResearchArtifactSchema>;

// ========================================
// REPORT (LAUDO) ARTIFACT
// ========================================
export const ReportQualitySchema = z.object({
  rating: z.enum(['good', 'adequate', 'limited']),
  notes: z.string().optional(),
});

export const ReportArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('report'),
  examType: z.string(),
  imageUrl: z.string().optional(),
  content: z.string().default(''),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  quality: ReportQualitySchema.optional(),
});

export type ReportArtifact = z.infer<typeof ReportArtifactSchema>;

// ========================================
// MINDMAP ARTIFACT
// ========================================
export const MindMapNodeSchema: z.ZodType<{
  id: string;
  label: string;
  children?: Array<{ id: string; label: string; children?: any[] }>;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    children: z.array(MindMapNodeSchema).optional(),
  })
);

export const MindMapArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('mindmap'),
  topic: z.string(),
  rootNode: MindMapNodeSchema.optional(),
  nodesCount: z.number().default(0),
});

export type MindMapArtifact = z.infer<typeof MindMapArtifactSchema>;

// ========================================
// CODE ARTIFACT
// ========================================
export const CodeArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('code'),
  language: z.string(),
  code: z.string().default(''),
  filename: z.string().optional(),
});

export type CodeArtifact = z.infer<typeof CodeArtifactSchema>;

// ========================================
// DIAGRAM ARTIFACT
// ========================================
export const DiagramArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('diagram'),
  diagramType: z.enum(['flowchart', 'sequence', 'mindmap', 'anatomy', 'mermaid']),
  mermaidCode: z.string().optional(),
  svgContent: z.string().optional(),
});

export type DiagramArtifact = z.infer<typeof DiagramArtifactSchema>;

// ========================================
// TEXT ARTIFACT
// ========================================
export const TextArtifactSchema = BaseArtifactSchema.extend({
  type: z.literal('text'),
  content: z.string().default(''),
  format: z.enum(['plain', 'markdown', 'html']).default('markdown'),
});

export type TextArtifact = z.infer<typeof TextArtifactSchema>;

// ========================================
// UNION TYPE
// ========================================
export const ArtifactSchema = z.discriminatedUnion('type', [
  SummaryArtifactSchema,
  FlashcardArtifactSchema,
  QuizArtifactSchema,
  ResearchArtifactSchema,
  ReportArtifactSchema,
  MindMapArtifactSchema,
  CodeArtifactSchema,
  DiagramArtifactSchema,
  TextArtifactSchema,
]);

export type Artifact = z.infer<typeof ArtifactSchema>;

// ========================================
// ARTIFACT TYPES ENUM
// ========================================
export const ArtifactTypes = {
  SUMMARY: 'summary',
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  RESEARCH: 'research',
  REPORT: 'report',
  MINDMAP: 'mindmap',
  CODE: 'code',
  DIAGRAM: 'diagram',
  TEXT: 'text',
} as const;

export type ArtifactType = (typeof ArtifactTypes)[keyof typeof ArtifactTypes];

// ========================================
// STREAMING EVENT TYPES
// ========================================
export const ArtifactEventSchema = z.object({
  eventType: z.enum(['start', 'update', 'progress', 'complete', 'error']),
  artifactId: z.string(),
  artifactType: z.string(),
  data: z.any(),
  timestamp: z.string().datetime(),
});

export type ArtifactEvent = z.infer<typeof ArtifactEventSchema>;

// ========================================
// FACTORY FUNCTIONS
// ========================================
export function createArtifactId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createSummaryArtifact(
  partial: Partial<SummaryArtifact> & { title: string; topic: string }
): SummaryArtifact {
  return SummaryArtifactSchema.parse({
    id: createArtifactId(),
    type: 'summary',
    stage: 'initializing',
    progress: 0,
    content: '',
    keyPoints: [],
    tags: [],
    wordCount: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createFlashcardArtifact(
  partial: Partial<FlashcardArtifact> & { title: string; topic: string }
): FlashcardArtifact {
  return FlashcardArtifactSchema.parse({
    id: createArtifactId(),
    type: 'flashcard',
    stage: 'initializing',
    progress: 0,
    cards: [],
    totalCards: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createQuizArtifact(
  partial: Partial<QuizArtifact> & { title: string; topic: string }
): QuizArtifact {
  return QuizArtifactSchema.parse({
    id: createArtifactId(),
    type: 'quiz',
    stage: 'initializing',
    progress: 0,
    difficulty: 'medium',
    questions: [],
    totalQuestions: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createResearchArtifact(
  partial: Partial<ResearchArtifact> & { title: string; query: string }
): ResearchArtifact {
  return ResearchArtifactSchema.parse({
    id: createArtifactId(),
    type: 'research',
    stage: 'initializing',
    progress: 0,
    content: '',
    sources: [],
    sourcesCount: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createReportArtifact(
  partial: Partial<ReportArtifact> & { title: string; examType: string }
): ReportArtifact {
  return ReportArtifactSchema.parse({
    id: createArtifactId(),
    type: 'report',
    stage: 'initializing',
    progress: 0,
    content: '',
    findings: [],
    recommendations: [],
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createCodeArtifact(
  partial: Partial<CodeArtifact> & { title: string; language: string }
): CodeArtifact {
  return CodeArtifactSchema.parse({
    id: createArtifactId(),
    type: 'code',
    stage: 'initializing',
    progress: 0,
    code: '',
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createDiagramArtifact(
  partial: Partial<DiagramArtifact> & { title: string; diagramType: string }
): DiagramArtifact {
  return DiagramArtifactSchema.parse({
    id: createArtifactId(),
    type: 'diagram',
    stage: 'initializing',
    progress: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  });
}

export function createTextArtifact(
  partial: Partial<TextArtifact> & { title: string }
): TextArtifact {
  return TextArtifactSchema.parse({
    id: createArtifactId(),
    type: 'text',
    stage: 'initializing',
    progress: 0,
    content: '',
    format: 'markdown',
    createdAt: new Date().toISOString(),
    ...partial,
  });
}
