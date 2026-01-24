/**
 * createDocument - Unified Document Creation Tool
 *
 * Single tool to create any type of artifact/document.
 * Replaces individual tools (createSummary, createFlashcards, etc.)
 * while maintaining backward compatibility.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getContextSafe } from '@/lib/ai/artifacts'
import {
  documentHandlers,
  generateDocumentId,
  type DocumentKind,
  type Document,
} from '@/lib/ai/artifacts/handlers'

// Admin client for persistence (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Unified schema using discriminated union by 'kind'
 */
const createDocumentSchema = z.discriminatedUnion('kind', [
  // Summary
  z.object({
    kind: z.literal('summary'),
    title: z.string().describe('Titulo do resumo'),
    topic: z.string().describe('Topico principal'),
    content: z.string().describe('Conteudo em markdown'),
    keyPoints: z.array(z.string()).describe('Pontos-chave (3-5 itens)'),
    tags: z.array(z.string()).optional(),
  }),

  // Flashcards
  z.object({
    kind: z.literal('flashcards'),
    title: z.string().describe('Titulo do deck'),
    topic: z.string().describe('Topico principal'),
    cards: z.array(z.object({
      front: z.string().describe('Pergunta'),
      back: z.string().describe('Resposta'),
      category: z.string().optional(),
    })).min(3).max(20).describe('Lista de flashcards'),
    tags: z.array(z.string()).optional(),
  }),

  // Quiz
  z.object({
    kind: z.literal('quiz'),
    title: z.string().describe('Titulo do quiz'),
    topic: z.string().describe('Topico principal'),
    specialty: z.string().optional().describe('Especialidade'),
    questions: z.array(z.object({
      text: z.string().describe('Enunciado'),
      options: z.array(z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })).length(5).describe('5 alternativas'),
      explanation: z.string().describe('Explicacao'),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })).min(3).max(10),
    tags: z.array(z.string()).optional(),
  }),

  // Research
  z.object({
    kind: z.literal('research'),
    title: z.string().describe('Titulo da pesquisa'),
    query: z.string().describe('Pergunta de pesquisa'),
    content: z.string().describe('Conteudo em markdown'),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      summary: z.string().optional(),
      authors: z.string().optional(),
      pubdate: z.string().optional(),
    })),
    methodology: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  // Report
  z.object({
    kind: z.literal('report'),
    title: z.string().describe('Titulo do laudo'),
    examType: z.string().describe('Tipo de exame'),
    content: z.string().describe('Laudo em markdown'),
    findings: z.array(z.string()).describe('Achados clinicos'),
    recommendations: z.array(z.string()).describe('Recomendacoes'),
    imageUrl: z.string().optional(),
    quality: z.object({
      rating: z.enum(['good', 'adequate', 'limited']),
      notes: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
  }),

  // Code (NEW)
  z.object({
    kind: z.literal('code'),
    title: z.string().describe('Titulo do codigo'),
    language: z.string().describe('Linguagem'),
    code: z.string().describe('Codigo fonte'),
    filename: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  // Text (NEW)
  z.object({
    kind: z.literal('text'),
    title: z.string().describe('Titulo'),
    content: z.string().describe('Conteudo'),
    format: z.enum(['plain', 'markdown', 'html']).optional().default('markdown'),
    tags: z.array(z.string()).optional(),
  }),

  // Diagram (NEW)
  z.object({
    kind: z.literal('diagram'),
    title: z.string().describe('Titulo do diagrama'),
    diagramType: z.enum(['flowchart', 'sequence', 'mindmap', 'anatomy', 'mermaid']),
    mermaidCode: z.string().optional().describe('Codigo Mermaid'),
    svgContent: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
])

type CreateDocumentParams = z.infer<typeof createDocumentSchema>

/**
 * createDocument tool
 *
 * Unified tool for creating any type of document/artifact.
 * Automatically persists to database if user context is available.
 */
export const createDocumentTool = tool({
  description: `Cria um documento/artifact. Use para gerar conteudo estruturado como:
- summary: resumos com pontos-chave
- flashcards: cards de estudo pergunta/resposta
- quiz: simulados com questoes de multipla escolha
- research: dossies de pesquisa com fontes
- report: laudos de analise de imagens
- code: trechos de codigo com syntax highlighting
- text: documentos de texto/markdown
- diagram: diagramas (flowchart, mermaid, etc.)`,

  parameters: createDocumentSchema,

  execute: async (params: CreateDocumentParams): Promise<Document> => {
    const id = generateDocumentId()
    const ctx = getContextSafe()
    const { kind } = params

    // Get the appropriate handler
    const handler = documentHandlers[kind]
    if (!handler) {
      throw new Error(`No handler for document kind: ${kind}`)
    }

    // Create the document using the handler
    // We need to cast params to remove the 'kind' discriminator for the handler
    const { kind: _, ...handlerParams } = params as Record<string, unknown>
    const document = handler.create(handlerParams, id)

    // Auto-persist if user context is available
    if (ctx?.userId) {
      try {
        const record = handler.toPersistenceRecord(document, {
          userId: ctx.userId,
          sessionId: ctx.sessionId,
          agentId: ctx.agentId,
        })

        await adminSupabase.from('artifacts').insert({
          id,
          ...record,
        })

        console.log(`[createDocument] ${kind} "${params.title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error(`[createDocument] Failed to persist ${kind}:`, err)
        // Don't throw - continue with returning the document
      }
    }

    return document
  },
})

/**
 * Export for use in chat API
 */
export { createDocumentSchema }
