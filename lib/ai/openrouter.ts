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
    'X-Title': 'MedVision — Image Analysis',
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

// Modelos disponíveis via OpenRouter (versões pagas - mais estáveis)
export const MODELS = {
  // Chat principal - Gemini 2.5 Pro (modelo avançado, alta inteligência)
  chat: 'google/gemini-2.5-pro',

  // Títulos de conversa - Gemini Flash (barato, suficiente para 3-4 palavras)
  titler: 'google/gemini-2.0-flash-001',

  // Pesquisa - Perplexity Sonar
  research: 'perplexity/sonar',

  // Visão - Gemini 3.1 Pro para análise de imagens radiográficas
  vision: 'google/gemini-3.1-pro-preview',

  // Fallbacks Gemini para visão (fallback chain)
  visionFallback1: 'google/gemini-3-pro-preview',
  visionFallback2: 'google/gemini-2.5-pro',

  // Escrita - para geração de conteúdo
  writer: 'anthropic/claude-3-haiku',

  // Fallback econômico - Llama 3.1 8B (muito barato)
  fallback: 'meta-llama/llama-3.1-8b-instruct',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

export const VISION_MODELS_LIST = [
  { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image', provider: 'Google' },
  { id: 'google/gemini-2.5-pro',             name: 'Gemini 2.5 Pro',     provider: 'Google' },
  { id: 'google/gemini-2.5-flash',           name: 'Gemini 2.5 Flash',   provider: 'Google' },
  { id: 'google/gemini-2.0-flash-001',       name: 'Gemini 2.0 Flash',   provider: 'Google' },
  { id: 'anthropic/claude-sonnet-4.6',       name: 'Claude Sonnet 4.6',  provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4-5',       name: 'Claude Sonnet 4.5',  provider: 'Anthropic' },
  { id: 'openai/gpt-4o',                     name: 'GPT-4o',             provider: 'OpenAI' },
  { id: 'meta-llama/llama-4-maverick',       name: 'Llama 4 Maverick',   provider: 'Meta' },
  { id: 'qwen/qwen2.5-vl-72b-instruct',     name: 'Qwen 2.5 VL 72B',   provider: 'Qwen' },
] as const

export type VisionModelInfo = typeof VISION_MODELS_LIST[number]
export const VISION_MODEL_IDS = new Set(VISION_MODELS_LIST.map(m => m.id))

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
