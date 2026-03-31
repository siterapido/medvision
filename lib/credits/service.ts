/**
 * Serviço de Créditos
 *
 * Funções server-side para verificar saldo, debitar e resetar créditos.
 * Usa o Supabase admin client para bypass de RLS.
 */

import { createClient } from '@supabase/supabase-js'
import { getPlanLimit, getModelCost } from './config'

// Admin client — contorna RLS (server-side only)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface UserCredits {
  balance: number
  monthly_limit: number
  period_start: string
  period_end: string
}

export type CreditTransactionType =
  | 'chat'
  | 'vision'
  | 'research'
  | 'artifact'
  | 'monthly_reset'
  | 'admin_grant'
  | 'plan_upgrade'

// ─── Leitura ──────────────────────────────────────────────────────────────────

/**
 * Retorna os créditos atuais do usuário.
 * Cria o registro se não existir.
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('balance, monthly_limit, period_start, period_end')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Registro não existe — inicializa com padrão free
      return await initializeCredits(userId, 'free')
    }
    console.error('[credits] getUserCredits error:', error)
    return null
  }

  return data
}

/**
 * Inicializa créditos para um usuário, baseado no seu plano.
 */
export async function initializeCredits(
  userId: string,
  planType: string,
  isAdmin = false
): Promise<UserCredits | null> {
  const supabase = getAdminClient()
  const limit = getPlanLimit(planType, isAdmin)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from('user_credits')
    .upsert(
      {
        user_id: userId,
        balance: limit,
        monthly_limit: limit,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('balance, monthly_limit, period_start, period_end')
    .single()

  if (error) {
    console.error('[credits] initializeCredits error:', error)
    return null
  }
  return data
}

// ─── Verificação ──────────────────────────────────────────────────────────────

/**
 * Verifica se o usuário tem créditos suficientes para usar um modelo.
 * Também trata o reset mensal se o período já expirou.
 */
export async function hasEnoughCredits(
  userId: string,
  modelId: string
): Promise<{ ok: boolean; balance: number; cost: number; monthly_limit: number }> {
  const supabase = getAdminClient()

  // Busca créditos + dados do perfil para saber o plano atual
  const [creditsRes, profileRes] = await Promise.all([
    supabase
      .from('user_credits')
      .select('balance, monthly_limit, period_end')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('plan_type, role, trial_ends_at')
      .eq('id', userId)
      .single(),
  ])

  const profile = profileRes.data
  const isAdmin = profile?.role === 'admin'

  // Admin: sempre libera
  if (isAdmin) {
    return { ok: true, balance: 999999, cost: 0, monthly_limit: 999999 }
  }

  let credits = creditsRes.data

  // Período expirou → reset mensal
  if (credits && new Date(credits.period_end) < new Date()) {
    const planType = resolvePlanType(profile)
    credits = await resetMonthlyCredits(userId, planType)
  }

  // Sem registro → inicializa
  if (!credits) {
    const planType = resolvePlanType(profile)
    const initialized = await initializeCredits(userId, planType, isAdmin)
    if (!initialized) return { ok: false, balance: 0, cost: getModelCost(modelId), monthly_limit: 0 }
    credits = initialized as any
  }

  const cost = getModelCost(modelId)
  const balance = credits?.balance ?? 0
  const monthly_limit = credits?.monthly_limit ?? 0

  return { ok: balance >= cost, balance, cost, monthly_limit }
}

// ─── Débito ───────────────────────────────────────────────────────────────────

/**
 * Debita créditos após uma chamada de IA bem-sucedida.
 */
export async function deductCredits(
  userId: string,
  modelId: string,
  type: CreditTransactionType,
  description?: string
): Promise<boolean> {
  const supabase = getAdminClient()
  const cost = getModelCost(modelId)

  // Verifica perfil para saber se é admin (não debita)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'admin') return true

  // Update atômico via RPC (usa GREATEST para não ir abaixo de 0)
  await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: cost,
  })

  // Registra transação
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -cost,
    type,
    model: modelId,
    description: description ?? `Uso: ${modelId}`,
  })

  return true
}

// ─── Reset mensal ─────────────────────────────────────────────────────────────

/**
 * Reseta os créditos para o novo período mensal.
 */
export async function resetMonthlyCredits(
  userId: string,
  planType: string,
  isAdmin = false
): Promise<UserCredits | null> {
  const supabase = getAdminClient()
  const limit = getPlanLimit(planType, isAdmin)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      balance: limit,
      monthly_limit: limit,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId)
    .select('balance, monthly_limit, period_start, period_end')
    .single()

  if (error) {
    console.error('[credits] resetMonthlyCredits error:', error)
    return null
  }

  // Registra transação de reset
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: limit,
    type: 'monthly_reset',
    description: `Reset mensal — plano ${planType} (${limit} créditos)`,
  })

  return data
}

/**
 * Atualiza o monthly_limit quando o plano do usuário muda.
 * Não altera o saldo atual para não prejudicar o ciclo em andamento.
 */
export async function updatePlanLimit(
  userId: string,
  newPlanType: string,
  isAdmin = false
): Promise<void> {
  const supabase = getAdminClient()
  const newLimit = getPlanLimit(newPlanType, isAdmin)

  await supabase
    .from('user_credits')
    .update({ monthly_limit: newLimit, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: 0,
    type: 'plan_upgrade',
    description: `Limite atualizado para plano ${newPlanType} (${newLimit} créditos/mês)`,
  })
}

// ─── Admin: concessão manual ──────────────────────────────────────────────────

/**
 * Concede créditos extras a um usuário (uso admin).
 */
export async function grantCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<void> {
  const supabase = getAdminClient()

  await supabase.rpc('grant_user_credits', {
    p_user_id: userId,
    p_amount: amount,
  })

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'admin_grant',
    description: description ?? `Créditos concedidos pelo admin: +${amount}`,
  })
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function resolvePlanType(profile: any): string {
  if (!profile) return 'free'
  if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) return 'trial'
  return profile.plan_type ?? 'free'
}
