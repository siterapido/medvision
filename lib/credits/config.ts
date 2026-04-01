/**
 * Configuração do Sistema de Créditos
 *
 * Créditos são consumidos a cada chamada de IA. O saldo é mensal e
 * reseta automaticamente no início de cada período.
 */

// ─── Limites mensais por plano (DESABILITADO — créditos ilimitados) ────────────

export const PLAN_CREDITS: Record<string, number> = {
  trial:       999999,
  free:        999999,
  basic:       999999,
  pro:         999999,
  certificate: 999999,
  admin:       999999,
}

// ─── Custo em créditos por modelo de IA ──────────────────────────────────────

export const MODEL_COSTS: Record<string, number> = {
  // Google — Gemini
  'google/gemini-2.5-pro':             10,
  'google/gemini-2.5-flash':            5,
  'google/gemini-2.0-flash-001':        1,  // titler — muito barato
  'google/gemini-3.1-pro-preview':     20,
  'google/gemini-3-pro-preview':       20,
  'google/gemini-3-pro-image-preview': 20,

  // Anthropic — Claude
  'anthropic/claude-3-haiku':          5,
  'anthropic/claude-sonnet-4-5':      15,
  'anthropic/claude-sonnet-4.6':      15,

  // OpenAI
  'openai/gpt-4o':                    15,

  // Perplexity
  'perplexity/sonar':                 15,

  // Meta / Qwen — modelos econômicos
  'meta-llama/llama-3.1-8b-instruct':  2,
  'meta-llama/llama-4-maverick':        8,
  'qwen/qwen2.5-vl-72b-instruct':       8,
}

/** Custo padrão para modelos não mapeados */
export const DEFAULT_MODEL_COST = 10

/**
 * Retorna o custo em créditos de um modelo.
 */
export function getModelCost(modelId: string): number {
  return MODEL_COSTS[modelId] ?? DEFAULT_MODEL_COST
}

/**
 * Retorna o limite mensal de créditos de um plano.
 * Recebe plan_type do perfil + indicador se ainda está em trial.
 */
export function getPlanLimit(planType: string | null, isAdmin = false): number {
  if (isAdmin) return PLAN_CREDITS.admin
  return PLAN_CREDITS[planType ?? 'free'] ?? PLAN_CREDITS.free
}
