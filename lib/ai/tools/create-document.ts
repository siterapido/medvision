/**
 * createDocument - Unified Document Creation Tool
 *
 * Single tool to create any type of artifact/document.
 * Uses structured generation (generateObject) to ensure 100% valid artifacts.
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
import { generateArtifact } from '@/lib/ai/structured-generation'

// Admin client for persistence (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Unified schema for all document kinds
 */
const createDocumentSchema = z.object({
  kind: z
    .enum(['summary', 'flashcards', 'quiz', 'research', 'report', 'code', 'text', 'diagram'])
    .describe('Tipo de documento a criar'),
  topic: z.string().describe('Topico ou assunto do documento'),
  context: z.string().optional().describe('Contexto adicional ou detalhes especificos'),
  userLevel: z.string().optional().describe('Nivel do estudante (ex: 3o semestre)'),
  additionalInstructions: z.string().optional().describe('Instrucoes adicionais'),
})

type CreateDocumentParams = z.infer<typeof createDocumentSchema>

/**
 * createDocument tool
 *
 * Unified tool for creating artifacts/documents with structured generation.
 * Supports all artifact kinds with guaranteed valid structure via generateObject.
 */
export const createDocumentTool = tool({
  description: `Cria um documento/artifact estruturado. Use quando o usuario pedir:
- summary: resumos, sinteses, explicacoes
- flashcards: cartoes de estudo
- quiz: simulados, questoes de multipla escolha
- research: dossies de pesquisa, revisoes bibliograficas
- report: laudos radiograficos, analise de imagens
- code: exemplos de codigo
- text: documentos de texto
- diagram: diagramas (Mermaid)`,

  parameters: createDocumentSchema,

  execute: async (params: CreateDocumentParams) => {
    const startTime = Date.now()
    const id = generateDocumentId()
    const ctx = getContextSafe()
    const { kind, topic, context, userLevel, additionalInstructions } = params

    console.log(`[createDocument] Generating ${kind} for topic: "${topic}"`)

    // Get the appropriate handler
    const handler = documentHandlers[kind as DocumentKind] as DocumentHandler<any, Document>
    if (!handler) {
      throw new Error(`No handler for document kind: ${kind}`)
    }

    try {
      // Use structured generation to guarantee valid artifact data
      const generatedData = await generateArtifact(kind as any, topic, {
        context,
        userLevel,
        additionalInstructions,
      })

      console.log(`[createDocument] Structured data generated in ${Date.now() - startTime}ms`)

      // Create the document using the handler with validated data
      const document = handler.create(generatedData, id)

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

          console.log(
            `[createDocument] ✓ ${kind} "${generatedData.title}" saved for user ${ctx.userId}`
          )
        } catch (err) {
          console.error(`[createDocument] Failed to persist ${kind}:`, err)
          // Don't throw - continue with returning the document
        }
      }

      console.log(`[createDocument] ✓ Total time: ${Date.now() - startTime}ms`)

      return document
    } catch (error) {
      console.error(`[createDocument] ✗ Failed to generate ${kind}:`, error)
      throw error
    }
  },
})

/**
 * Export for use in chat API
 */
export { createDocumentSchema }
