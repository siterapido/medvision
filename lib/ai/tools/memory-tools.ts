/**
 * Memory Tools for MedVision Agent
 *
 * Tools that allow the agent to:
 * - Remember important facts about the student
 * - Recall relevant memories for context
 * - Update student profile
 */

import { z } from 'zod'
import { tool } from 'ai'
import { memoryService } from '../memory'
import { getContext } from '../artifacts/context'

/**
 * Tool to save a fact about the student for future reference
 */
export const rememberFact = tool({
  description:
    'Salva um fato importante sobre o aluno para lembrar em conversas futuras. Use quando descobrir informacoes relevantes como universidade, semestre, area de interesse, dificuldades, ou preferencias de estudo.',
  inputSchema: z.object({
    content: z.string().describe('O fato a ser memorizado (ex: "Aluno estuda na USP, 5o semestre")'),
    topic: z.string().optional().describe('Topico relacionado (ex: "perfil academico", "periodontia")'),
    type: z
      .enum(['long_term', 'fact'])
      .default('fact')
      .describe('Tipo de memoria: "long_term" para perfil do aluno, "fact" para informacoes pontuais'),
    importance: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Importancia do fato para futuras interacoes'),
  }),
  execute: async ({ content, topic, type, importance }) => {
    const ctx = getContext()

    if (!ctx?.userId) {
      return { success: false, message: 'Contexto do usuario nao disponivel' }
    }

    const memory = await memoryService.saveMemory({
      userId: ctx.userId,
      agentId: ctx.agentId || 'medvision',
      type,
      content,
      topic,
      confidence: importance === 'high' ? 1.0 : importance === 'medium' ? 0.8 : 0.6,
      sessionId: ctx.sessionId,
      metadata: {
        source: 'conversation',
        importance,
      },
    })

    if (memory) {
      return {
        success: true,
        message: `Memorizado: "${content.substring(0, 50)}..."`,
        memoryId: memory.id,
      }
    }

    return { success: false, message: 'Erro ao salvar memoria' }
  },
})

/**
 * Tool to recall relevant memories about the student
 */
export const recallMemories = tool({
  description:
    'Busca memorias relevantes sobre o aluno baseado em uma pergunta ou topico. Use para recuperar contexto antes de responder perguntas complexas.',
  inputSchema: z.object({
    query: z.string().describe('O que voce quer lembrar sobre o aluno (ex: "nivel de conhecimento", "area de interesse")'),
    limit: z.number().optional().default(5).describe('Numero maximo de memorias a retornar'),
  }),
  execute: async ({ query, limit }) => {
    const ctx = getContext()

    if (!ctx?.userId) {
      return { memories: [], message: 'Contexto do usuario nao disponivel' }
    }

    const memories = await memoryService.searchMemories(ctx.userId, query, {
      types: ['long_term', 'fact'],
      limit,
    })

    if (memories.length === 0) {
      return {
        memories: [],
        message: 'Nenhuma memoria relevante encontrada',
      }
    }

    return {
      memories: memories.map((m) => ({
        content: m.content,
        topic: m.topic,
        relevance: m.similarity,
      })),
      message: `Encontradas ${memories.length} memorias relevantes`,
    }
  },
})

/**
 * Tool to update student profile directly
 */
export const updateStudentProfile = tool({
  description:
    'Atualiza o perfil academico do aluno. Use quando o aluno informar dados como universidade, semestre, especialidade de interesse, ou nivel de conhecimento.',
  inputSchema: z.object({
    university: z.string().optional().describe('Nome da universidade'),
    semester: z.string().optional().describe('Semestre atual (ex: "5o semestre", "Recem-formado")'),
    specialty: z.string().optional().describe('Especialidade de interesse (ex: "Endodontia", "Ortodontia")'),
    level: z.string().optional().describe('Nivel de conhecimento (ex: "Iniciante", "Intermediario", "Avancado")'),
    learningStyle: z
      .enum(['visual', 'reading', 'practice', 'mixed'])
      .optional()
      .describe('Estilo de aprendizado preferido'),
    responsePreference: z
      .enum(['direct', 'didactic', 'hybrid'])
      .optional()
      .describe('Preferencia de tipo de resposta'),
  }),
  execute: async ({ university, semester, specialty, level, learningStyle, responsePreference }) => {
    const ctx = getContext()

    if (!ctx?.userId) {
      return { success: false, message: 'Contexto do usuario nao disponivel' }
    }

    const updates: Record<string, any> = {}
    if (university) updates.university = university
    if (semester) updates.semester = semester
    if (specialty) updates.specialty = specialty
    if (level) updates.level = level
    if (learningStyle) updates.learningStyle = learningStyle
    if (responsePreference) updates.responsePreference = responsePreference

    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'Nenhuma informacao para atualizar' }
    }

    const success = await memoryService.updateUserProfile(ctx.userId, updates)

    if (success) {
      // Also save as a long-term memory for semantic search
      const updateSummary = Object.entries(updates)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

      await memoryService.saveMemory({
        userId: ctx.userId,
        agentId: 'medvision',
        type: 'long_term',
        content: `Perfil do aluno atualizado: ${updateSummary}`,
        topic: 'perfil academico',
        confidence: 1.0,
        sessionId: ctx.sessionId,
        metadata: {
          source: 'manual',
          importance: 'high',
        },
      })

      return {
        success: true,
        message: `Perfil atualizado: ${updateSummary}`,
      }
    }

    return { success: false, message: 'Erro ao atualizar perfil' }
  },
})

/**
 * Tool to get current student context
 */
export const getStudentContext = tool({
  description:
    'Obtem o contexto completo do aluno incluindo perfil e memorias relevantes. Use no inicio de conversas ou quando precisar adaptar a resposta ao nivel do aluno.',
  inputSchema: z.object({
    query: z.string().optional().describe('Topico da conversa atual para buscar memorias relevantes'),
  }),
  execute: async ({ query }) => {
    const ctx = getContext()

    if (!ctx?.userId) {
      return { profile: null, memories: [], message: 'Contexto do usuario nao disponivel' }
    }

    const userContext = await memoryService.getUserContext(ctx.userId, query)

    return {
      profile: userContext.profile
        ? {
            university: userContext.profile.university,
            semester: userContext.profile.semester,
            specialty: userContext.profile.specialty,
            level: userContext.profile.level,
            learningStyle: userContext.profile.learningStyle,
            responsePreference: userContext.profile.responsePreference || 'hybrid',
          }
        : null,
      memories: userContext.longTerm.slice(0, 5).map((m) => ({
        content: m.content,
        topic: m.topic,
      })),
      recentTopics: userContext.episodic.slice(0, 3).map((m) => m.topic).filter(Boolean),
      message: userContext.profile
        ? 'Contexto do aluno carregado'
        : 'Perfil do aluno ainda nao configurado',
    }
  },
})

/**
 * Export all memory tools
 */
export const memoryTools = {
  rememberFact,
  recallMemories,
  updateStudentProfile,
  getStudentContext,
}
