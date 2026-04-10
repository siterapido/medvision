import { z } from 'zod'
import type { DocumentHandler, SummaryDocument, SummaryParams } from '../types'

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
        agent: ctx.agentId || 'medvision',
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
