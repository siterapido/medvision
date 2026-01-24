import type { Artifact, ArtifactKind } from '@/components/artifacts/types'

/**
 * Normaliza artifacts de formatos antigos para o novo formato unificado
 */
export function normalizeArtifact(raw: any): Artifact | null {
  if (!raw || !raw.type) return null

  // Mapear tipos antigos para novos kinds se necessário
  let kind: ArtifactKind = raw.type as ArtifactKind
  if (raw.type === 'exam') kind = 'quiz'
  if (raw.type === 'research-dossier') kind = 'research'
  if (raw.type === 'mindmap') kind = 'diagram'

  const base = {
    id: raw.id,
    kind,
    title: raw.title,
    description: raw.description,
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
  }

  // Extrair conteúdo dependendo do tipo
  const content = raw.content || {}

  switch (kind) {
    case 'summary':
      return {
        ...base,
        kind: 'summary',
        content: content.markdownContent || content.content || '',
        keyPoints: content.keyPoints || [],
        topic: content.topic,
        tags: content.tags || raw.metadata?.tags || [],
      }

    case 'flashcard':
      return {
        ...base,
        kind: 'flashcard',
        cards: content.cards || [],
        topic: content.topic,
      }

    case 'quiz':
      return {
        ...base,
        kind: 'quiz',
        topic: content.topic,
        specialty: content.specialty,
        questions: content.questions || [],
      }

    case 'research':
      return {
        ...base,
        kind: 'research',
        query: content.query,
        content: content.markdownContent || content.content || '',
        sources: content.sources || [],
        methodology: content.methodology,
      }

    case 'report':
      return {
        ...base,
        kind: 'report',
        examType: content.examType,
        content: content.markdownContent || content.content || '',
        findings: content.findings || [],
        recommendations: content.recommendations || [],
        imageUrl: content.imageUrl,
        quality: content.quality,
      }

    case 'code':
      return {
        ...base,
        kind: 'code',
        language: content.language || 'javascript',
        code: content.code || '',
        filename: content.filename,
      }

    case 'text':
      return {
        ...base,
        kind: 'text',
        content: content.content || '',
        format: content.format || 'markdown',
      }

    case 'diagram':
      return {
        ...base,
        kind: 'diagram',
        diagramType: content.diagramType || 'mermaid',
        mermaidCode: content.mermaidCode || content.data,
        svgContent: content.svgContent,
      }

    default:
      return null
  }
}
