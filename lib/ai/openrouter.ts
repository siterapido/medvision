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

// Modelos disponíveis via OpenRouter
export const MODELS = {
  // Chat principal - GLM-5.1 (modelo padrão)
  chat: 'z-ai/glm-5.1',

  // Visão — GLM-5V Turbo como padrão (Med Vision); ref. https://openrouter.ai/z-ai/glm-5v-turbo
  vision: 'z-ai/glm-5v-turbo',

  // Fallback de visão - Gemini 2.5 Pro (suporte multimodal confirmado)
  visionFallback: 'google/gemini-2.5-pro',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

export const VISION_MODELS_LIST = [
  { id: 'openai/gpt-5.4-pro',             name: 'GPT-5.4 Pro',        provider: 'OpenAI' },
  { id: 'anthropic/claude-sonnet-4.6',    name: 'Claude Sonnet 4.6',  provider: 'Anthropic' },
  { id: 'z-ai/glm-5v-turbo',              name: 'GLM-5V Turbo',       provider: 'Z-AI' },
] as const

export type VisionModelInfo = typeof VISION_MODELS_LIST[number]
export const VISION_MODEL_IDS = new Set(VISION_MODELS_LIST.map(m => m.id))

/** Cadeia padrão Med Vision: modelo primário + fallback multimodal. */
export const DEFAULT_VISION_MODEL_CHAIN = [MODELS.vision, MODELS.visionFallback] as const

/**
 * Ordem de tentativa: modelo escolhido na UI primeiro, depois os restantes da cadeia padrão (sem duplicar).
 */
export function buildVisionModelChain(selectedModel?: string | null): readonly string[] {
  if (!selectedModel) {
    return [...DEFAULT_VISION_MODEL_CHAIN]
  }
  const inUiList = (VISION_MODEL_IDS as Set<string>).has(selectedModel)
  const inDefaultChain = (DEFAULT_VISION_MODEL_CHAIN as readonly string[] as string[]).includes(
    selectedModel,
  )
  if (inUiList || inDefaultChain) {
    const rest = DEFAULT_VISION_MODEL_CHAIN.filter((id) => id !== selectedModel)
    return [selectedModel, ...rest]
  }
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
