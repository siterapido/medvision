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
 * OpenRouter dedicado ao Med Vision (análise de imagem em /api/vision/analyze).
 * Usa MEDVISION_OPENROUTER_API_KEY se definida; senão cai no OPENROUTER_API_KEY.
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

/**
 * OpenRouter model factory — always uses Chat Completions API.
 * Usage: openrouter('google/gemini-2.0-flash-001')
 */
export const openrouter = (modelId: string) => openrouterProvider.chat(modelId)

/**
 * Mesmo contrato que `openrouter`, mas com chave opcionalmente separada (Med Vision / visão).
 */
export const openrouterMedVision = (modelId: string) =>
  openrouterMedVisionProvider.chat(modelId)

/** True se a rota de visão tiver alguma chave OpenRouter disponível. */
export function hasMedVisionOpenRouterKey(): boolean {
  return Boolean(
    process.env.MEDVISION_OPENROUTER_API_KEY?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim()
  )
}

// Modelos disponíveis via OpenRouter - Kimi k2.6 e Qwen3 VL
export const MODELS = {
  // Chat principal
  chat: 'moonshotai/kimi-k2.6',

  // Visão — Kimi k2.6 (padrão)
  vision: 'moonshotai/kimi-k2.6',

  // Qwen3 VL (alternativa)
  visionQwen: 'qwen/qwen3-vl-235b-a22b-thinking',

  // Fallback desativado (mesmo modelo)
  visionFallback: 'moonshotai/kimi-k2.6',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

export const VISION_MODELS_LIST = [
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi k2.6', provider: 'Moonshot' },
  { id: 'qwen/qwen3-vl-235b-a22b-thinking', name: 'Qwen3 VL 235B', provider: 'Qwen' },
] as const

export type VisionModelInfo = typeof VISION_MODELS_LIST[number]
export const VISION_MODEL_IDS = new Set(VISION_MODELS_LIST.map(m => m.id))

/** Cadeia padrão Med Vision: apenas Kimi k2.6, sem fallback */
export const DEFAULT_VISION_MODEL_CHAIN = [MODELS.vision] as const

/**
 * Retorna apenas o modelo único (Kimi k2.6).
 */
export function buildVisionModelChain(_selectedModel?: string | null): readonly string[] {
  return [...DEFAULT_VISION_MODEL_CHAIN]
}

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
