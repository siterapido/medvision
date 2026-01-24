import { tool } from 'ai'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'
import { getContextSafe } from '@/lib/ai/artifacts'

// Unified tools (Phase 2)
export { createDocumentTool } from './create-document'
export { updateDocumentTool } from './update-document'

// Admin client para persistência (bypassa RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================
// LEGACY TOOLS (deprecated, use createDocument instead)
// Mantidos para backward compatibility
// =====================================

// Tool para criar resumos
export const createSummaryTool = tool({
  description: 'Cria um resumo estruturado sobre um tópico odontológico. Use quando o aluno pedir um resumo, síntese ou explicação organizada.',
  inputSchema: z.object({
    title: z.string().describe('Título do resumo'),
    content: z.string().describe('Conteúdo completo em markdown'),
    keyPoints: z.array(z.string()).describe('Lista de pontos-chave (3-5 itens)'),
    topic: z.string().describe('Tópico principal'),
    tags: z.array(z.string()).optional().describe('Tags para categorização'),
  }),
  execute: async ({ title, content, keyPoints, topic, tags }) => {
    const artifactId = nanoid()
    const ctx = getContextSafe()

    const artifact = {
      type: 'summary' as const,
      id: artifactId,
      title,
      content,
      keyPoints,
      topic,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    }

    // Auto-persistir se tiver contexto de usuário
    if (ctx?.userId) {
      try {
        await adminSupabase.from('artifacts').insert({
          id: artifactId,
          user_id: ctx.userId,
          title,
          type: 'summary',
          content: {
            markdownContent: content,
            keyPoints,
            topic,
            tags: tags || [],
          },
          description: `Resumo sobre ${topic}`,
          ai_context: { agent: ctx.agentId || 'odonto-gpt', sessionId: ctx.sessionId },
          metadata: { tags: tags || [] },
        })
        console.log(`[Artifact] Summary "${title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error('[Artifact] Failed to persist summary:', err)
      }
    }

    return artifact
  }
})

// Tool para criar flashcards
export const createFlashcardsTool = tool({
  description: 'Cria um deck de flashcards para memorização. Use quando o aluno quiser estudar com cards de pergunta/resposta.',
  inputSchema: z.object({
    title: z.string().describe('Título do deck'),
    cards: z.array(z.object({
      front: z.string().describe('Pergunta ou termo'),
      back: z.string().describe('Resposta'),
      category: z.string().optional().describe('Categoria do card'),
    })).min(3).max(20).describe('Lista de flashcards (3-20 cards)'),
    topic: z.string().describe('Tópico principal'),
  }),
  execute: async ({ title, cards, topic }) => {
    const artifactId = nanoid()
    const ctx = getContextSafe()

    const processedCards = cards.map((card, index) => ({
      id: `card-${index + 1}`,
      front: card.front,
      back: card.back,
      category: card.category,
    }))

    const artifact = {
      type: 'flashcards' as const,
      id: artifactId,
      title,
      cards: processedCards,
      topic,
      createdAt: new Date().toISOString(),
    }

    // Auto-persistir se tiver contexto de usuário
    if (ctx?.userId) {
      try {
        await adminSupabase.from('artifacts').insert({
          id: artifactId,
          user_id: ctx.userId,
          title,
          type: 'flashcards',
          content: {
            topic,
            cards: processedCards,
          },
          description: `Flashcards sobre ${topic}`,
          ai_context: { agent: ctx.agentId || 'odonto-gpt', sessionId: ctx.sessionId },
          metadata: { count: processedCards.length },
        })
        console.log(`[Artifact] Flashcards "${title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error('[Artifact] Failed to persist flashcards:', err)
      }
    }

    return artifact
  }
})

// Tool para criar quiz/simulado
export const createQuizTool = tool({
  description: 'Cria um simulado/quiz com questões de múltipla escolha. Use quando o aluno quiser praticar com questões.',
  inputSchema: z.object({
    title: z.string().describe('Título do simulado'),
    topic: z.string().describe('Tópico principal'),
    specialty: z.string().optional().describe('Especialidade (ex: Endodontia, Periodontia)'),
    questions: z.array(z.object({
      text: z.string().describe('Enunciado da questão'),
      options: z.array(z.object({
        text: z.string().describe('Texto da alternativa'),
        isCorrect: z.boolean().describe('Se esta é a resposta correta'),
      })).length(5).describe('Exatamente 5 alternativas'),
      explanation: z.string().describe('Explicação detalhada da resposta'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('Nível de dificuldade'),
    })).min(3).max(10).describe('Lista de questões (3-10)'),
  }),
  execute: async ({ title, topic, specialty, questions }) => {
    const artifactId = nanoid()
    const ctx = getContextSafe()

    const processedQuestions = questions.map((q, qIndex) => ({
      id: `q-${qIndex + 1}`,
      text: q.text,
      options: q.options.map((opt, optIndex) => ({
        id: String.fromCharCode(65 + optIndex), // A, B, C, D, E
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))

    const artifact = {
      type: 'quiz' as const,
      id: artifactId,
      title,
      topic,
      specialty,
      questions: processedQuestions,
      createdAt: new Date().toISOString(),
    }

    // Auto-persistir se tiver contexto de usuário
    if (ctx?.userId) {
      try {
        await adminSupabase.from('artifacts').insert({
          id: artifactId,
          user_id: ctx.userId,
          title,
          type: 'exam', // quiz usa tipo 'exam' no banco
          content: {
            topic,
            specialty,
            questions: processedQuestions,
          },
          description: `Simulado de ${topic}`,
          ai_context: { agent: ctx.agentId || 'odonto-practice', sessionId: ctx.sessionId },
          metadata: { specialty, questionCount: processedQuestions.length },
        })
        console.log(`[Artifact] Quiz "${title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error('[Artifact] Failed to persist quiz:', err)
      }
    }

    return artifact
  }
})

// Tool para criar dossiê de pesquisa
export const createResearchTool = tool({
  description: 'Cria um dossiê de pesquisa científica com fontes e análise. Use após realizar pesquisa com askPerplexity ou searchPubMed.',
  inputSchema: z.object({
    title: z.string().describe('Título da pesquisa'),
    query: z.string().describe('Pergunta de pesquisa original'),
    content: z.string().describe('Conteúdo completo em markdown com análise'),
    sources: z.array(z.object({
      title: z.string().describe('Título do artigo/fonte'),
      url: z.string().describe('URL da fonte'),
      summary: z.string().optional().describe('Resumo de 2-3 linhas'),
      authors: z.string().optional().describe('Autores'),
      pubdate: z.string().optional().describe('Data de publicação'),
    })).describe('Lista de fontes consultadas'),
    methodology: z.string().optional().describe('Metodologia de busca utilizada'),
  }),
  execute: async ({ title, query, content, sources, methodology }) => {
    const artifactId = nanoid()
    const ctx = getContextSafe()

    const artifact = {
      type: 'research' as const,
      id: artifactId,
      title,
      query,
      content,
      sources,
      methodology,
      createdAt: new Date().toISOString(),
    }

    // Auto-persistir se tiver contexto de usuário
    if (ctx?.userId) {
      try {
        await adminSupabase.from('artifacts').insert({
          id: artifactId,
          user_id: ctx.userId,
          title,
          type: 'research',
          content: {
            query,
            markdownContent: content,
            sources,
            methodology,
          },
          description: `Pesquisa sobre ${query || title}`,
          ai_context: { agent: ctx.agentId || 'odonto-research', sessionId: ctx.sessionId },
          metadata: { sourcesCount: sources.length, methodology },
        })
        console.log(`[Artifact] Research "${title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error('[Artifact] Failed to persist research:', err)
      }
    }

    return artifact
  }
})

// Tool para criar laudo radiográfico
export const createReportTool = tool({
  description: 'Cria um laudo de análise de imagem odontológica. Use após analisar radiografias ou fotos clínicas.',
  inputSchema: z.object({
    title: z.string().describe('Título do laudo'),
    examType: z.string().describe('Tipo de exame (Panorâmica, Periapical, CBCT, etc.)'),
    content: z.string().describe('Laudo completo em markdown'),
    findings: z.array(z.string()).describe('Lista de achados clínicos'),
    recommendations: z.array(z.string()).describe('Lista de recomendações'),
    imageUrl: z.string().optional().describe('URL da imagem analisada'),
    quality: z.object({
      rating: z.enum(['good', 'adequate', 'limited']).describe('Qualidade técnica'),
      notes: z.string().optional().describe('Observações sobre qualidade'),
    }).optional().describe('Avaliação da qualidade técnica'),
  }),
  execute: async ({ title, examType, content, findings, recommendations, imageUrl, quality }) => {
    const artifactId = nanoid()
    const ctx = getContextSafe()

    const artifact = {
      type: 'report' as const,
      id: artifactId,
      title,
      examType,
      content,
      findings,
      recommendations,
      imageUrl,
      quality,
      createdAt: new Date().toISOString(),
    }

    // Auto-persistir se tiver contexto de usuário
    if (ctx?.userId) {
      try {
        await adminSupabase.from('artifacts').insert({
          id: artifactId,
          user_id: ctx.userId,
          title,
          type: 'report',
          content: {
            examType,
            markdownContent: content,
            findings,
            recommendations,
            imageUrl,
            quality,
          },
          description: `Laudo de ${examType}`,
          ai_context: { agent: ctx.agentId || 'odonto-vision', sessionId: ctx.sessionId },
          metadata: { examType, findingsCount: findings.length },
        })
        console.log(`[Artifact] Report "${title}" saved for user ${ctx.userId}`)
      } catch (err) {
        console.error('[Artifact] Failed to persist report:', err)
      }
    }

    return artifact
  }
})

// Mapeamento de tools por agente (LEGACY - usar AGENT_UNIFIED_TOOLS para novos agentes)
export const AGENT_ARTIFACT_TOOLS = {
  'odonto-gpt': {
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool
  },
  'odonto-research': {
    createResearch: createResearchTool
  },
  'odonto-practice': {
    createQuiz: createQuizTool
  },
  'odonto-summary': {
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool
  },
  'odonto-vision': {
    createReport: createReportTool
  }
} as const

export type AgentToolsMap = typeof AGENT_ARTIFACT_TOOLS

/**
 * Get artifact tools for an agent (legacy)
 * @deprecated Use getUnifiedArtifactTools instead
 */
export function getAgentArtifactTools(agentId: string) {
  return AGENT_ARTIFACT_TOOLS[agentId as keyof typeof AGENT_ARTIFACT_TOOLS] || {}
}

// =====================================
// UNIFIED TOOLS (Phase 2+)
// Single createDocument tool that handles all artifact types
// =====================================

import { createDocumentTool } from './create-document'
import { updateDocumentTool } from './update-document'

/**
 * Unified artifact tools - all agents use the same tools
 * The createDocument tool handles all artifact types via 'kind' parameter
 */
export const UNIFIED_ARTIFACT_TOOLS = {
  createDocument: createDocumentTool,
  updateDocument: updateDocumentTool,
} as const

/**
 * Get unified artifact tools for any agent
 * This replaces getAgentArtifactTools for new implementations
 */
export function getUnifiedArtifactTools() {
  return UNIFIED_ARTIFACT_TOOLS
}
