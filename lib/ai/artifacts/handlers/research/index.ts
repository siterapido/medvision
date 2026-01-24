import { z } from 'zod'
import type { DocumentHandler, ResearchDocument, ResearchParams } from '../types'

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
