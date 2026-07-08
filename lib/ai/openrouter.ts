/**
 * OpenRouter Provider Configuration
 *
 * Utiliza o @ai-sdk/openai com baseURL customizado para OpenRouter.
 * Isso permite acesso a centenas de modelos via uma única API.
 *
 * IMPORTANTE: Em AI SDK v6, o provider padrão do OpenAI usa a Responses API,
 * que não é suportada pelo OpenRouter. Usamos `.chat()` para forçar a
 * Chat Completions API.
 */

import { createOpenAI } from '@ai-sdk/openai'

const openRouterHeaders = {
  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'X-Title': 'MedVision',
} as const

// Provider base (não exportar diretamente - usa Responses API por padrão)
const openrouterProvider = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: openRouterHeaders,
})

/**
 * OpenRouter model factory — always uses Chat Completions API.
 * Usage: openrouter('google/gemini-2.0-flash-001')
 */
export const openrouter = (modelId: string) => openrouterProvider.chat(modelId)

/**
 * OpenRouter dedicado ao Med Vision — legado; visão migrou para OpenCode Go.
 * Mantido apenas se algum fluxo ainda referenciar; prefira @/lib/ai/opencode-go.
 */
const medVisionOpenRouterKey =
  process.env.MEDVISION_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY

const openrouterMedVisionProvider = createOpenAI({
  name: 'openrouter-medvision-vision',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: medVisionOpenRouterKey,
  headers: {
    ...openRouterHeaders,
    'X-Title': 'MedVision - Image Analysis',
  },
})

/** @deprecated Use opencodeGoMedVision de @/lib/ai/opencode-go */
export const openrouterMedVision = (modelId: string) =>
  openrouterMedVisionProvider.chat(modelId)

/** @deprecated Use hasMedVisionOpenCodeGoKey de @/lib/ai/opencode-go */
export function hasMedVisionOpenRouterKey(): boolean {
  return Boolean(
    process.env.MEDVISION_OPENROUTER_API_KEY?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim()
  )
}

// Modelos disponíveis via OpenRouter — chat e embeddings
export const MODELS = {
  chat: 'moonshotai/kimi-k2.6',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

/**
 * Cria um modelo OpenRouter com o ID especificado (Chat Completions API)
 */
export function createModel(modelId: ModelId | string) {
  return openrouter(modelId)
}

/**
 * Configuração padrão para chamadas de streaming
 */
export const DEFAULT_STREAM_CONFIG = {
  maxDuration: 120, // 120 segundos para respostas detalhadas
  temperature: 0.65,
  maxTokens: 8000,
} as const

/**
 * Configuração otimizada para análise de imagem (vision)
 */
export const VISION_CONFIG = {
  temperature: 0.5, //Mais baixo para maior precisão factual
  maxTokens: 10000, // Mais tokens para laudos completos
  topP: 0.9,
} as const
