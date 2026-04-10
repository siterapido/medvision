import { z } from 'zod'
import type { DocumentHandler, DiagramDocument, DiagramParams } from '../types'

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
      type: 'mindmap', // diagram maps to 'mindmap' in database
      content: {
        diagramType: doc.diagramType,
        mermaidCode: doc.mermaidCode,
        svgContent: doc.svgContent,
        description: doc.description,
      },
      description: doc.description || `Diagrama ${doc.diagramType}`,
      ai_context: {
        agent: ctx.agentId || 'medvision',
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
