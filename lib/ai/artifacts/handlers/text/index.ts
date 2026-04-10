import { z } from 'zod'
import type { DocumentHandler, TextDocument, TextParams } from '../types'

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
      type: 'document', // text maps to 'document' in database
      content: {
        content: doc.content,
        format: doc.format,
      },
      description: `Texto: ${doc.title}`,
      ai_context: {
        agent: ctx.agentId || 'medvision',
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
