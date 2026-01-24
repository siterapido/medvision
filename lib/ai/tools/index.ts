/**
 * Unified Tools Index
 *
 * Mapeamento centralizado de ferramentas por agente.
 * Este arquivo elimina a duplicação e serve como ponto único de configuração.
 */

import {
  askPerplexity,
  searchPubMed,
  updateUserProfile,
} from './definitions'

import {
  createSummaryTool,
  createFlashcardsTool,
  createQuizTool,
  createResearchTool,
  createReportTool,
} from './artifact-tools'

// ========================================
// FERRAMENTAS DE PESQUISA
// ========================================
export const researchTools = {
  askPerplexity,
  searchPubMed,
}

// ========================================
// FERRAMENTAS DE PERFIL
// ========================================
export const profileTools = {
  updateUserProfile,
}

// ========================================
// FERRAMENTAS DE ARTEFATOS
// ========================================
export const artifactTools = {
  createSummary: createSummaryTool,
  createFlashcards: createFlashcardsTool,
  createQuiz: createQuizTool,
  createResearch: createResearchTool,
  createReport: createReportTool,
}

// ========================================
// MAPEAMENTO POR AGENTE
// ========================================

/**
 * Mapeamento de ferramentas disponíveis para cada agente.
 * Cada agente tem acesso a um subconjunto específico de ferramentas.
 */
export const AGENT_TOOLS = {
  'odonto-gpt': {
    // Pesquisa
    askPerplexity,
    searchPubMed,
    // Perfil
    updateUserProfile,
    // Artefatos
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool,
  },

  'odonto-research': {
    // Pesquisa
    askPerplexity,
    searchPubMed,
    // Perfil
    updateUserProfile,
    // Artefatos
    createResearch: createResearchTool,
  },

  'odonto-practice': {
    // Pesquisa
    askPerplexity,
    // Perfil
    updateUserProfile,
    // Artefatos
    createQuiz: createQuizTool,
  },

  'odonto-summary': {
    // Perfil
    updateUserProfile,
    // Artefatos
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool,
  },

  'odonto-vision': {
    // Perfil
    updateUserProfile,
    // Artefatos
    createReport: createReportTool,
  },
} as const

export type AgentId = keyof typeof AGENT_TOOLS

/**
 * Retorna as ferramentas disponíveis para um agente específico.
 */
export function getToolsForAgent(agentId: string): Record<string, any> {
  return AGENT_TOOLS[agentId as AgentId] || AGENT_TOOLS['odonto-gpt']
}

// Objeto consolidado de ferramentas (para compatibilidade)
export const tools = {
  // Pesquisa
  askPerplexity,
  searchPubMed,

  // Perfil
  updateUserProfile,

  // Artefatos
  createSummary: createSummaryTool,
  createFlashcards: createFlashcardsTool,
  createQuiz: createQuizTool,
  createResearch: createResearchTool,
  createReport: createReportTool,
}

export type ToolName = keyof typeof tools

// Re-export para conveniência
export {
  askPerplexity,
  searchPubMed,
  updateUserProfile,
  createSummaryTool,
  createFlashcardsTool,
  createQuizTool,
  createResearchTool,
  createReportTool,
}
