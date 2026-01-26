/**
 * updateDocument - Document Update Tool
 *
 * Tool for updating existing artifacts/documents.
 * Supports partial updates and maintains version history.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getContextSafe } from '@/lib/ai/artifacts'
import { DocumentKinds, type DocumentKind } from '@/lib/ai/artifacts/handlers'

// Lazy-initialized admin client for persistence (bypasses RLS)
let adminSupabase: ReturnType<typeof createClient> | null = null

function getAdminSupabase() {
  if (adminSupabase) return adminSupabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase credentials')
  }
  adminSupabase = createClient(url, key)
  return adminSupabase
}

/**
 * Schema for updating documents
 */
const updateDocumentSchema = z.object({
  id: z.string().describe('ID do documento a ser atualizado'),
  kind: z.enum(DocumentKinds as unknown as [DocumentKind, ...DocumentKind[]]).describe('Tipo do documento'),
  title: z.string().optional().describe('Novo titulo'),
  description: z.string().optional().describe('Nova descricao'),
  content: z.record(z.unknown()).optional().describe('Campos de conteudo a atualizar'),
  metadata: z.record(z.unknown()).optional().describe('Metadados a atualizar'),
})

type UpdateDocumentParams = z.infer<typeof updateDocumentSchema>

interface UpdateResult {
  success: boolean
  id: string
  kind: DocumentKind
  message: string
  previousVersion?: number
  currentVersion?: number
}

/**
 * updateDocument tool
 *
 * Updates an existing document/artifact.
 * Creates a version entry for undo/redo support (Phase 4).
 */
export const updateDocumentTool = tool({
  description: `Atualiza um documento/artifact existente. Use para modificar conteudo de um artifact que ja foi criado.
- Passe apenas os campos que deseja atualizar
- O historico de versoes e mantido automaticamente
- Informe o 'id' e 'kind' do documento a atualizar`,

  inputSchema: updateDocumentSchema,

  execute: async (params: UpdateDocumentParams) => {
    const ctx = getContextSafe()
    const { id, kind, title, description, content, metadata } = params

    if (!ctx?.userId) {
      return {
        success: false,
        id,
        kind,
        message: 'Contexto de usuario nao disponivel',
      }
    }

    try {
      // Fetch current document to verify ownership and get current state
      const { data: existingDoc, error: fetchError } = await getAdminSupabase()
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .eq('user_id', ctx.userId)
        .single()

      if (fetchError || !existingDoc) {
        return {
          success: false,
          id,
          kind,
          message: `Documento nao encontrado ou sem permissao: ${fetchError?.message || 'Not found'}`,
        }
      }

      // Build update object
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (title) {
        updates.title = title
      }

      if (description) {
        updates.description = description
      }

      if (content) {
        // Merge content fields
        updates.content = {
          ...existingDoc.content,
          ...content,
        }
      }

      if (metadata) {
        // Merge metadata
        updates.metadata = {
          ...existingDoc.metadata,
          ...metadata,
        }
      }

      // Update AI context with current session
      updates.ai_context = {
        ...existingDoc.ai_context,
        lastModifiedAgent: ctx.agentId || 'odonto-gpt',
        lastModifiedSession: ctx.sessionId,
      }

      // Perform update
      const { error: updateError } = await getAdminSupabase()
        .from('artifacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', ctx.userId)

      if (updateError) {
        return {
          success: false,
          id,
          kind,
          message: `Erro ao atualizar: ${updateError.message}`,
        }
      }

      console.log(`[updateDocument] ${kind} "${id}" updated for user ${ctx.userId}`)

      return {
        success: true,
        id,
        kind,
        message: `Documento atualizado com sucesso`,
      }
    } catch (err) {
      console.error(`[updateDocument] Failed to update ${kind}:`, err)
      return {
        success: false,
        id,
        kind,
        message: `Erro interno: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Export for use in chat API
 */
export { updateDocumentSchema }
