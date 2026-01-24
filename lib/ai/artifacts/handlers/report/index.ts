import { z } from 'zod'
import type { DocumentHandler, ReportDocument, ReportParams } from '../types'

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
