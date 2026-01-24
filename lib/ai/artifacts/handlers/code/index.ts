import { z } from 'zod'
import type { DocumentHandler, CodeDocument, CodeParams } from '../types'

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
