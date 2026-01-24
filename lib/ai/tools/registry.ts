/**
 * Unified Tool Registry for Odonto GPT
 *
 * Consolidates all tools with metadata for:
 * - Tool approval flow (needsApproval flag)
 * - Agent-specific tool mapping
 * - Tool categorization
 */

import { tool } from 'ai'
import { z } from 'zod'

// Fallback type for CoreTool if not exported
type CoreTool = any

// Import existing tools
import {
  askPerplexity,
  searchPubMed,
  updateUserProfile,
  saveResearch,
  savePracticeExam,
  saveSummary,
  saveFlashcards,
  saveMindMap,
  saveImageAnalysis,
  generateArtifact,
} from './definitions'

import {
  rememberFact,
  recallMemories,
  updateStudentProfile,
  getStudentContext,
} from './memory-tools'

import {
  createSummaryTool,
  createFlashcardsTool,
  createQuizTool,
  createResearchTool,
  createReportTool,
  createDocumentTool,
  updateDocumentTool,
} from './artifact-tools'

// ========================================
// TOOL METADATA TYPES
// ========================================

export type ToolCategory =
  | 'research'
  | 'memory'
  | 'profile'
  | 'artifact'
  | 'analysis'

export interface ToolMetadata {
  name: string
  description: string
  category: ToolCategory
  needsApproval: boolean
  approvalMessage?: string
  agents: string[] // Which agents can use this tool
}

export interface RegisteredTool {
  tool: CoreTool
  metadata: ToolMetadata
}

// ========================================
// TOOL REGISTRY
// ========================================

export const TOOL_REGISTRY: Record<string, RegisteredTool> = {
  // ============ UNIFIED ARTIFACT TOOLS (PHASE 2) ============
  createDocument: {
    tool: createDocumentTool as any,
    metadata: {
      name: 'createDocument',
      description: 'Cria um artifact (resumo, quiz, flashcards, codigo, diagramas, etc.)',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision'],
    },
  },

  updateDocument: {
    tool: updateDocumentTool as any,
    metadata: {
      name: 'updateDocument',
      description: 'Atualiza um artifact existente',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision'],
    },
  },

  // ============ RESEARCH TOOLS ============
  askPerplexity: {
    tool: askPerplexity,
    metadata: {
      name: 'askPerplexity',
      description: 'Busca online com Perplexity AI',
      category: 'research',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice'],
    },
  },

  searchPubMed: {
    tool: searchPubMed,
    metadata: {
      name: 'searchPubMed',
      description: 'Pesquisa no PubMed',
      category: 'research',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research'],
    },
  },

  // ============ MEMORY TOOLS ============
  rememberFact: {
    tool: rememberFact,
    metadata: {
      name: 'rememberFact',
      description: 'Salva fato sobre o aluno',
      category: 'memory',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary'],
    },
  },

  recallMemories: {
    tool: recallMemories,
    metadata: {
      name: 'recallMemories',
      description: 'Busca memorias do aluno',
      category: 'memory',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary'],
    },
  },

  getStudentContext: {
    tool: getStudentContext,
    metadata: {
      name: 'getStudentContext',
      description: 'Obtem contexto do aluno',
      category: 'memory',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision'],
    },
  },

  // ============ PROFILE TOOLS (REQUIRE APPROVAL) ============
  updateStudentProfile: {
    tool: updateStudentProfile,
    metadata: {
      name: 'updateStudentProfile',
      description: 'Atualiza perfil academico do aluno',
      category: 'profile',
      needsApproval: true,
      approvalMessage: 'Deseja atualizar seu perfil academico com estas informacoes?',
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary'],
    },
  },

  updateUserProfile: {
    tool: updateUserProfile,
    metadata: {
      name: 'updateUserProfile',
      description: 'Atualiza perfil do usuario',
      category: 'profile',
      needsApproval: true,
      approvalMessage: 'Deseja salvar estas informacoes no seu perfil?',
      agents: ['odonto-gpt', 'odonto-research'],
    },
  },

  // ============ ARTIFACT CREATION TOOLS ============
  createSummary: {
    tool: createSummaryTool,
    metadata: {
      name: 'createSummary',
      description: 'Cria resumo estruturado',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-summary'],
    },
  },

  createFlashcards: {
    tool: createFlashcardsTool,
    metadata: {
      name: 'createFlashcards',
      description: 'Cria deck de flashcards',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-summary'],
    },
  },

  createQuiz: {
    tool: createQuizTool,
    metadata: {
      name: 'createQuiz',
      description: 'Cria quiz/simulado',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-practice'],
    },
  },

  createResearch: {
    tool: createResearchTool,
    metadata: {
      name: 'createResearch',
      description: 'Cria dossie de pesquisa',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-research'],
    },
  },

  createReport: {
    tool: createReportTool,
    metadata: {
      name: 'createReport',
      description: 'Cria laudo radiografico',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-vision'],
    },
  },

  generateArtifact: {
    tool: generateArtifact,
    metadata: {
      name: 'generateArtifact',
      description: 'Gera artefato educacional generico',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary'],
    },
  },

  // ============ ARTIFACT SAVING TOOLS (REQUIRE APPROVAL) ============
  saveResearch: {
    tool: saveResearch,
    metadata: {
      name: 'saveResearch',
      description: 'Salva dossie de pesquisa',
      category: 'artifact',
      needsApproval: true,
      approvalMessage: 'Deseja salvar este dossie de pesquisa?',
      agents: ['odonto-research'],
    },
  },

  savePracticeExam: {
    tool: savePracticeExam,
    metadata: {
      name: 'savePracticeExam',
      description: 'Salva simulado',
      category: 'artifact',
      needsApproval: true,
      approvalMessage: 'Deseja salvar este simulado?',
      agents: ['odonto-practice'],
    },
  },

  saveSummary: {
    tool: saveSummary,
    metadata: {
      name: 'saveSummary',
      description: 'Salva resumo',
      category: 'artifact',
      needsApproval: false, // Auto-saves are OK for summaries
      agents: ['odonto-gpt', 'odonto-summary'],
    },
  },

  saveFlashcards: {
    tool: saveFlashcards,
    metadata: {
      name: 'saveFlashcards',
      description: 'Salva flashcards',
      category: 'artifact',
      needsApproval: false, // Auto-saves are OK
      agents: ['odonto-gpt', 'odonto-summary'],
    },
  },

  saveMindMap: {
    tool: saveMindMap,
    metadata: {
      name: 'saveMindMap',
      description: 'Salva mapa mental',
      category: 'artifact',
      needsApproval: false,
      agents: ['odonto-summary'],
    },
  },

  saveImageAnalysis: {
    tool: saveImageAnalysis,
    metadata: {
      name: 'saveImageAnalysis',
      description: 'Salva analise de imagem',
      category: 'analysis',
      needsApproval: false,
      agents: ['odonto-vision'],
    },
  },
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get tools for a specific agent.
 */
export function getToolsForAgent(agentId: string): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {}

  for (const [name, registered] of Object.entries(TOOL_REGISTRY)) {
    if (registered.metadata.agents.includes(agentId)) {
      tools[name] = registered.tool
    }
  }

  return tools
}

/**
 * Get tool names that require approval for an agent.
 */
export function getApprovalToolsForAgent(agentId: string): string[] {
  return Object.entries(TOOL_REGISTRY)
    .filter(
      ([_, registered]) =>
        registered.metadata.needsApproval &&
        registered.metadata.agents.includes(agentId)
    )
    .map(([name]) => name)
}

/**
 * Check if a tool requires approval.
 */
export function toolNeedsApproval(toolName: string): boolean {
  return TOOL_REGISTRY[toolName]?.metadata.needsApproval ?? false
}

/**
 * Get approval message for a tool.
 */
export function getToolApprovalMessage(toolName: string): string {
  return (
    TOOL_REGISTRY[toolName]?.metadata.approvalMessage ??
    `Deseja executar a acao "${toolName}"?`
  )
}

/**
 * Get tool metadata.
 */
export function getToolMetadata(toolName: string): ToolMetadata | undefined {
  return TOOL_REGISTRY[toolName]?.metadata
}

/**
 * Get all tools by category.
 */
export function getToolsByCategory(category: ToolCategory): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {}

  for (const [name, registered] of Object.entries(TOOL_REGISTRY)) {
    if (registered.metadata.category === category) {
      tools[name] = registered.tool
    }
  }

  return tools
}

/**
 * List all available tools.
 */
export function listAllTools(): ToolMetadata[] {
  return Object.values(TOOL_REGISTRY).map((r) => r.metadata)
}

// ========================================
// AGENT TOOL PRESETS
// ========================================

export const AGENT_TOOL_PRESETS = {
  'odonto-gpt': {
    maxSteps: 10,
    tools: getToolsForAgent('odonto-gpt'),
    approvalTools: getApprovalToolsForAgent('odonto-gpt'),
  },
  'odonto-research': {
    maxSteps: 8,
    tools: getToolsForAgent('odonto-research'),
    approvalTools: getApprovalToolsForAgent('odonto-research'),
  },
  'odonto-practice': {
    maxSteps: 6,
    tools: getToolsForAgent('odonto-practice'),
    approvalTools: getApprovalToolsForAgent('odonto-practice'),
  },
  'odonto-summary': {
    maxSteps: 5,
    tools: getToolsForAgent('odonto-summary'),
    approvalTools: getApprovalToolsForAgent('odonto-summary'),
  },
  'odonto-vision': {
    maxSteps: 3,
    tools: getToolsForAgent('odonto-vision'),
    approvalTools: getApprovalToolsForAgent('odonto-vision'),
  },
} as const

export type AgentToolPreset = (typeof AGENT_TOOL_PRESETS)[keyof typeof AGENT_TOOL_PRESETS]

/**
 * Get tool preset for an agent.
 */
export function getAgentToolPreset(agentId: string): AgentToolPreset {
  return (
    AGENT_TOOL_PRESETS[agentId as keyof typeof AGENT_TOOL_PRESETS] ??
    AGENT_TOOL_PRESETS['odonto-gpt']
  )
}
