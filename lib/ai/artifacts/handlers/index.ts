/**
 * Document Handlers Registry
 *
 * Implements DocumentHandler for each document kind.
 * Used by createDocument and updateDocument tools.
 */

import { z } from 'zod'
import { nanoid } from 'nanoid'
import type {
  DocumentHandler,
  DocumentKind,
  DocumentHandlerContext,
  ArtifactDBRecord,
  // Document types
  SummaryDocument,
  SummaryParams,
  FlashcardsDocument,
  FlashcardsParams,
  FlashcardCard,
  QuizDocument,
  QuizParams,
  QuizQuestion,
  ResearchDocument,
  ResearchParams,
  ReportDocument,
  ReportParams,
  CodeDocument,
  CodeParams,
  TextDocument,
  TextParams,
  DiagramDocument,
  DiagramParams,
} from './types'

// =====================================
// Summary Handler
// =====================================

const summarySchema = z.object({
  title: z.string().describe('Titulo do resumo'),
  topic: z.string().describe('Topico principal do resumo'),
  content: z.string().describe('Conteudo em markdown do resumo'),
  keyPoints: z.array(z.string()).describe('Pontos-chave do resumo'),
  tags: z.array(z.string()).optional().describe('Tags para categorização'),
})

export const summaryHandler: DocumentHandler<SummaryParams, SummaryDocument> = {
  kind: 'summary',
  schema: summarySchema,

  create(params, id) {
    return {
      id,
      kind: 'summary',
      title: params.title,
      topic: params.topic,
      content: params.content,
      keyPoints: params.keyPoints,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'summary',
      content: {
        topic: doc.topic,
        markdownContent: doc.content,
        keyPoints: doc.keyPoints,
      },
      description: `Resumo sobre ${doc.topic}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        keyPointsCount: doc.keyPoints.length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Resumo: ${doc.topic} (${doc.keyPoints.length} pontos-chave)`
  },
}

// =====================================
// Flashcards Handler
// =====================================

const flashcardsSchema = z.object({
  title: z.string().describe('Titulo do deck de flashcards'),
  topic: z.string().describe('Topico dos flashcards'),
  cards: z.array(z.object({
    front: z.string().describe('Frente do card (pergunta)'),
    back: z.string().describe('Verso do card (resposta)'),
    category: z.string().optional().describe('Categoria do card'),
  })).describe('Lista de flashcards'),
  tags: z.array(z.string()).optional(),
})

export const flashcardsHandler: DocumentHandler<FlashcardsParams, FlashcardsDocument> = {
  kind: 'flashcards',
  schema: flashcardsSchema,

  create(params, id) {
    const cards: FlashcardCard[] = params.cards.map((c, i) => ({
      id: `card-${i + 1}`,
      front: c.front,
      back: c.back,
      category: c.category,
    }))

    return {
      id,
      kind: 'flashcards',
      title: params.title,
      topic: params.topic,
      cards,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'flashcards',
      content: {
        topic: doc.topic,
        cards: doc.cards,
      },
      description: `${doc.cards.length} flashcards sobre ${doc.topic}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        cardCount: doc.cards.length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Flashcards: ${doc.topic} (${doc.cards.length} cards)`
  },
}

// =====================================
// Quiz Handler
// =====================================

const quizSchema = z.object({
  title: z.string().describe('Titulo do quiz'),
  topic: z.string().describe('Topico do quiz'),
  questions: z.array(z.object({
    text: z.string().describe('Texto da pergunta'),
    options: z.array(z.object({
      text: z.string().describe('Texto da opcao'),
      isCorrect: z.boolean().describe('Se esta opcao e a correta'),
    })).describe('Opcoes de resposta'),
    explanation: z.string().describe('Explicacao da resposta correta'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Dificuldade'),
  })).describe('Lista de questoes'),
  specialty: z.string().optional().describe('Especialidade odontologica'),
  tags: z.array(z.string()).optional(),
})

export const quizHandler: DocumentHandler<QuizParams, QuizDocument> = {
  kind: 'quiz',
  schema: quizSchema,

  create(params, id) {
    const questions: QuizQuestion[] = params.questions.map((q, i) => ({
      id: `q-${i + 1}`,
      text: q.text,
      options: q.options.map((opt, j) => ({
        id: `opt-${i + 1}-${j + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))

    return {
      id,
      kind: 'quiz',
      title: params.title,
      topic: params.topic,
      questions,
      specialty: params.specialty,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'quiz',
      content: {
        topic: doc.topic,
        questions: doc.questions,
        specialty: doc.specialty,
      },
      description: `Quiz de ${doc.topic} com ${doc.questions.length} questoes`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        questionCount: doc.questions.length,
        specialty: doc.specialty,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Quiz: ${doc.topic} (${doc.questions.length} questoes)`
  },
}

// =====================================
// Research Handler
// =====================================

const researchSchema = z.object({
  title: z.string().describe('Titulo da pesquisa'),
  query: z.string().describe('Query/pergunta de pesquisa'),
  content: z.string().describe('Conteudo da pesquisa em markdown'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    summary: z.string().optional(),
    authors: z.string().optional(),
    pubdate: z.string().optional(),
  })).describe('Fontes utilizadas'),
  methodology: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const researchHandler: DocumentHandler<ResearchParams, ResearchDocument> = {
  kind: 'research',
  schema: researchSchema,

  create(params, id) {
    return {
      id,
      kind: 'research',
      title: params.title,
      query: params.query,
      content: params.content,
      sources: params.sources,
      methodology: params.methodology,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'research',
      content: {
        query: doc.query,
        markdownContent: doc.content,
        sources: doc.sources,
        methodology: doc.methodology,
      },
      description: `Pesquisa: ${doc.query}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-research',
        sessionId: ctx.sessionId,
      },
      metadata: {
        sourceCount: doc.sources.length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Pesquisa: ${doc.query} (${doc.sources.length} fontes)`
  },
}

// =====================================
// Report Handler
// =====================================

const reportSchema = z.object({
  title: z.string().describe('Titulo do laudo'),
  examType: z.string().describe('Tipo de exame (ex: panoramica, periapical)'),
  content: z.string().describe('Conteudo do laudo'),
  findings: z.array(z.string()).describe('Achados clinicos'),
  recommendations: z.array(z.string()).describe('Recomendacoes'),
  imageUrl: z.string().optional().describe('URL da imagem analisada'),
  quality: z.object({
    rating: z.enum(['good', 'adequate', 'limited']),
    notes: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
})

export const reportHandler: DocumentHandler<ReportParams, ReportDocument> = {
  kind: 'report',
  schema: reportSchema,

  create(params, id) {
    return {
      id,
      kind: 'report',
      title: params.title,
      examType: params.examType,
      content: params.content,
      findings: params.findings,
      recommendations: params.recommendations,
      imageUrl: params.imageUrl,
      quality: params.quality,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'report',
      content: {
        examType: doc.examType,
        content: doc.content,
        findings: doc.findings,
        recommendations: doc.recommendations,
        imageUrl: doc.imageUrl,
        quality: doc.quality,
      },
      description: `Laudo de ${doc.examType}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-vision',
        sessionId: ctx.sessionId,
      },
      metadata: {
        findingsCount: doc.findings.length,
        recommendationsCount: doc.recommendations.length,
        examType: doc.examType,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Laudo: ${doc.examType} (${doc.findings.length} achados)`
  },
}

// =====================================
// Code Handler (NEW)
// =====================================

const codeSchema = z.object({
  title: z.string().describe('Titulo do codigo'),
  language: z.string().describe('Linguagem de programacao'),
  code: z.string().describe('Codigo fonte'),
  filename: z.string().optional().describe('Nome do arquivo'),
  description: z.string().optional().describe('Descricao do que o codigo faz'),
  tags: z.array(z.string()).optional(),
})

export const codeHandler: DocumentHandler<CodeParams, CodeDocument> = {
  kind: 'code',
  schema: codeSchema,

  create(params, id) {
    return {
      id,
      kind: 'code',
      title: params.title,
      language: params.language,
      code: params.code,
      filename: params.filename,
      description: params.description,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'code',
      content: {
        language: doc.language,
        code: doc.code,
        filename: doc.filename,
        description: doc.description,
      },
      description: doc.description || `Codigo ${doc.language}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        language: doc.language,
        filename: doc.filename,
        lineCount: doc.code.split('\n').length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Codigo ${doc.language}${doc.filename ? `: ${doc.filename}` : ''}`
  },
}

// =====================================
// Text Handler (NEW)
// =====================================

const textSchema = z.object({
  title: z.string().describe('Titulo do texto'),
  content: z.string().describe('Conteudo do texto'),
  format: z.enum(['plain', 'markdown', 'html']).optional().default('markdown'),
  tags: z.array(z.string()).optional(),
})

export const textHandler: DocumentHandler<TextParams, TextDocument> = {
  kind: 'text',
  schema: textSchema,

  create(params, id) {
    return {
      id,
      kind: 'text',
      title: params.title,
      content: params.content,
      format: params.format || 'markdown',
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'text',
      content: {
        content: doc.content,
        format: doc.format,
      },
      description: `Texto: ${doc.title}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        format: doc.format,
        wordCount: doc.content.split(/\s+/).length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Texto: ${doc.title}`
  },
}

// =====================================
// Diagram Handler (NEW)
// =====================================

const diagramSchema = z.object({
  title: z.string().describe('Titulo do diagrama'),
  diagramType: z.enum(['flowchart', 'sequence', 'mindmap', 'anatomy', 'mermaid']).describe('Tipo de diagrama'),
  mermaidCode: z.string().optional().describe('Codigo Mermaid para renderizar'),
  svgContent: z.string().optional().describe('Conteudo SVG do diagrama'),
  description: z.string().optional().describe('Descricao do diagrama'),
  tags: z.array(z.string()).optional(),
})

export const diagramHandler: DocumentHandler<DiagramParams, DiagramDocument> = {
  kind: 'diagram',
  schema: diagramSchema,

  create(params, id) {
    return {
      id,
      kind: 'diagram',
      title: params.title,
      diagramType: params.diagramType,
      mermaidCode: params.mermaidCode,
      svgContent: params.svgContent,
      description: params.description,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'diagram',
      content: {
        diagramType: doc.diagramType,
        mermaidCode: doc.mermaidCode,
        svgContent: doc.svgContent,
        description: doc.description,
      },
      description: doc.description || `Diagrama ${doc.diagramType}`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        diagramType: doc.diagramType,
        hasMermaid: !!doc.mermaidCode,
        hasSvg: !!doc.svgContent,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Diagrama ${doc.diagramType}: ${doc.title}`
  },
}

// =====================================
// Handler Registry
// =====================================

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
