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

// Provider base (não exportar diretamente - usa Responses API por padrão)
const openrouterProvider = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OdontoGPT',
  },
})

/**
 * OpenRouter model factory — always uses Chat Completions API.
 * Usage: openrouter('google/gemini-2.0-flash-001')
 */
export const openrouter = (modelId: string) => openrouterProvider.chat(modelId)

// Modelos disponíveis via OpenRouter (versões pagas - mais estáveis)
export const MODELS = {
  // Chat principal - Gemini Flash (muito barato: ~$0.075/1M tokens)
  chat: 'google/gemini-2.0-flash-001',

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
  maxDuration: 60, // 60 segundos para Edge Functions
  temperature: 0.7,
  maxTokens: 4000,
} as const
