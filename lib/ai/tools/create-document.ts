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
  type DocumentHandler,
} from '@/lib/ai/artifacts/handlers'

// Admin client for persistence (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Unified schema using discriminated union by 'kind'
 */
const createDocumentSchema = z.object({
  kind: z.literal('summary').describe('Tipo de documento (apenas summary suportado no momento)'),
  title: z.string().describe('Titulo do resumo'),
  topic: z.string().describe('Topico principal'),
  content: z.string().describe('Conteudo em markdown'),
  keyPoints: z.array(z.string()).describe('Pontos-chave (3-5 itens)'),
  tags: z.array(z.string()).optional(),
})

type CreateDocumentParams = z.infer<typeof createDocumentSchema>

/**
 * createDocument tool
 *
 * Unified tool for creating artifacts/documents.
 * Currently restricted to 'summary' type for focused implementation.
 */
export const createDocumentTool = tool({
  description: `Cria um documento/artifact de resumo. Use para gerar conteudo estruturado quando o usuario pedir um resumo, sintese ou explicacao.`,

  inputSchema: createDocumentSchema,

  execute: async (params: CreateDocumentParams) => {
    const id = generateDocumentId()
    const ctx = getContextSafe()
    const { kind, ...handlerParams } = params

    // Get the appropriate handler
    const handler = documentHandlers[kind as DocumentKind] as DocumentHandler<any, Document>
    if (!handler) {
      throw new Error(`No handler for document kind: ${kind}`)
    }

    // Create the document using the handler
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
