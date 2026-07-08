/**
 * OpenCode Go Provider — Med Vision (análise de imagem)
 *
 * API OpenAI-compatible em https://opencode.ai/zen/go/v1
 * Docs: https://opencode.ai/docs/go/
 *
 * Usa createOpenAI + .chat() (Chat Completions), igual ao padrão OpenRouter no projeto.
 */

import { createOpenAI } from '@ai-sdk/openai'

const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1'

const openCodeGoHeaders = {
  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'X-Title': 'MedVision',
} as const

const medVisionOpenCodeGoKey =
  process.env.MEDVISION_OPENCODE_API_KEY ?? process.env.OPENCODE_API_KEY

const opencodeGoMedVisionProvider = createOpenAI({
  name: 'opencode-go-medvision',
  baseURL: OPENCODE_GO_BASE_URL,
  apiKey: medVisionOpenCodeGoKey,
  headers: {
    ...openCodeGoHeaders,
    'X-Title': 'MedVision - Image Analysis',
  },
})

/** Factory de modelo OpenCode Go (Chat Completions). Ex.: opencodeGoMedVision('kimi-k2.6') */
export const opencodeGoMedVision = (modelId: string) =>
  opencodeGoMedVisionProvider.chat(modelId)

/** True se a rota de visão tiver chave OpenCode Go disponível. */
export function hasMedVisionOpenCodeGoKey(): boolean {
  return Boolean(
    process.env.MEDVISION_OPENCODE_API_KEY?.trim() ||
      process.env.OPENCODE_API_KEY?.trim(),
  )
}

/** Modelos de visão via OpenCode Go (multimodal) */
export const MODELS = {
  vision: 'kimi-k2.6',
  visionAlt: 'kimi-k2.7-code',
  visionFallback: 'kimi-k2.6',
} as const

export type VisionModelId = (typeof MODELS)[keyof typeof MODELS]

export const VISION_MODELS_LIST = [
  { id: 'kimi-k2.6', name: 'Kimi k2.6', provider: 'OpenCode Go' },
  { id: 'kimi-k2.7-code', name: 'Kimi k2.7 Code', provider: 'OpenCode Go' },
] as const

export type VisionModelInfo = (typeof VISION_MODELS_LIST)[number]
export const VISION_MODEL_IDS = new Set(VISION_MODELS_LIST.map((m) => m.id))

/** Cadeia padrão Med Vision: Kimi k2.6 com Kimi k2.7 Code como fallback */
export const DEFAULT_VISION_MODEL_CHAIN = [MODELS.vision, MODELS.visionAlt] as const

/**
 * Retorna a cadeia de modelos com fallback.
 * Se o modelo selecionado for diferente do padrão, usa ele como primeiro e os defaults como fallback.
 */
export function buildVisionModelChain(selectedModel?: string | null): readonly string[] {
  const defaultModels = [...DEFAULT_VISION_MODEL_CHAIN]

  if (
    selectedModel &&
    selectedModel !== MODELS.vision &&
    selectedModel !== MODELS.visionAlt
  ) {
    return [selectedModel, ...defaultModels]
  }

  if (selectedModel === MODELS.visionAlt) {
    return [MODELS.visionAlt, MODELS.vision]
  }

  return defaultModels
}

/** Configuração otimizada para análise de imagem (vision) */
export const VISION_CONFIG = {
  temperature: 0.5,
  maxTokens: 10000,
  topP: 0.9,
} as const
