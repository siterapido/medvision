/**
 * AI Analytics - Tracking and cost calculation for AI operations
 *
 * Provides helpers for tracking AI completion metrics and calculating costs.
 */

/**
 * Track AI completion metrics
 *
 * Logs completion details for observability. In production, this could
 * integrate with analytics services (Vercel Analytics, Posthog, etc.)
 */
export function trackAICompletion(data: {
  agentId: string
  modelId: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  toolsUsed: string[]
  duration: number
  success: boolean
  artifactType?: string
  sessionId?: string
  userId?: string
}) {
  const cost = calculateCost(data.tokens.total, data.modelId)

  const metrics = {
    agent: data.agentId,
    model: data.modelId,
    tokens: data.tokens,
    cost,
    tools: data.toolsUsed.join(','),
    duration: data.duration,
    success: data.success,
    artifact: data.artifactType,
    session: data.sessionId,
    user: data.userId,
  }

  console.log('[AI Completion]', {
    ...metrics,
    timestamp: new Date().toISOString(),
  })

  // In production, send to analytics service:
  // track('ai_completion', metrics)

  return metrics
}

/**
 * Calculate cost based on token usage and model
 *
 * Pricing as of January 2025 (update as needed)
 */
export function calculateCost(totalTokens: number, modelId: string): number {
  // Pricing per 1K tokens (input + output averaged for simplicity)
  const costsPer1k: Record<string, number> = {
    // Free models
    'google/gemini-2.0-flash-exp:free': 0,
    'google/gemini-2.0-flash-001': 0,
    'google/gemini-2.0-flash-thinking-exp:free': 0,

    // OpenRouter models (approximate pricing)
    'anthropic/claude-3.5-sonnet': 0.003, // $3 per 1M tokens
    'anthropic/claude-3.5-sonnet-20241022': 0.003,
    'anthropic/claude-3-opus': 0.015, // $15 per 1M tokens
    'openai/gpt-4': 0.03, // $30 per 1M tokens
    'openai/gpt-4-turbo': 0.01, // $10 per 1M tokens
    'openai/gpt-3.5-turbo': 0.0005, // $0.5 per 1M tokens

    // Default fallback
    default: 0.001,
  }

  const costPer1k = costsPer1k[modelId] ?? costsPer1k.default
  const costPerToken = costPer1k / 1000

  return totalTokens * costPerToken
}

/**
 * Track step completion in multi-step tool execution
 */
export function trackStep(data: {
  stepType: 'initial' | 'continue'
  toolCalls?: { toolName: string; args: any }[]
  toolResults?: { toolName: string; result: any }[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}) {
  console.log('[AI Step]', {
    type: data.stepType,
    tools: data.toolCalls?.map(tc => tc.toolName) || [],
    results: data.toolResults?.length || 0,
    tokens: data.usage?.totalTokens || 0,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Calculate token usage statistics
 */
export function getTokenStats(usage: {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}) {
  return {
    prompt: usage.promptTokens,
    completion: usage.completionTokens,
    total: usage.totalTokens,
    ratio: (usage.completionTokens / usage.totalTokens).toFixed(2),
  }
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
