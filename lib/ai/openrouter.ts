/**
 * OpenRouter Provider Configuration
 * 
 * Utiliza o @ai-sdk/openai com baseURL customizado para OpenRouter.
 * Isso permite acesso a centenas de modelos via uma única API.
 */

import { createOpenAI } from '@ai-sdk/openai'

// Criar provider OpenRouter usando a compatibilidade OpenAI
export const openrouter = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OdontoGPT',
  },
})

// Modelos disponíveis via OpenRouter (versões pagas - mais estáveis)
export const MODELS = {
  // Chat principal - Gemini Flash (muito barato: ~$0.075/1M tokens)
  chat: 'google/gemini-2.0-flash-001',

  // Pesquisa - Perplexity Sonar
  research: 'perplexity/sonar',

  // Visão - para análise de imagens radiográficas
  vision: 'anthropic/claude-3.5-sonnet',

  // Escrita - para geração de conteúdo
  writer: 'anthropic/claude-3-haiku',

  // Fallback econômico - Llama 3.1 8B (muito barato)
  fallback: 'meta-llama/llama-3.1-8b-instruct',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

/**
 * Cria um modelo OpenRouter com o ID especificado
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
