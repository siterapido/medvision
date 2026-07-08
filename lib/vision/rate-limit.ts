/**
 * Rate limiting e cost guard por usuário.
 *
 * - Limite diário: N análises/dia (configurável por plano)
 * - Limite semanal: N análises/semana
 * - Armazenamento: tabela Supabase `vision_usage_log` ou fallback in-memory
 *
 * Estratégia: consulta Supabase para contagem; se falhar, permite (fail-open).
 */

export interface RateLimitConfig {
    dailyLimit: number
    weeklyLimit: number
}

const DEFAULT_FREE_LIMIT: RateLimitConfig = {
    dailyLimit: 20,
    weeklyLimit: 100,
}

const DEFAULT_PRO_LIMIT: RateLimitConfig = {
    dailyLimit: 100,
    weeklyLimit: 500,
}

/**
 * Resolve limite baseado no plano do usuário.
 * Pode ser estendido para consultar subscriptions no Supabase.
 */
export function getRateLimitForUser(
    userPlan?: string | null,
): RateLimitConfig {
    if (userPlan === 'pro' || userPlan === 'enterprise') {
        return DEFAULT_PRO_LIMIT
    }
    // Sobrescreve via env para debug/admin
    const envDaily = Number(process.env.MEDVISION_RATE_LIMIT_DAILY)
    const envWeekly = Number(process.env.MEDVISION_RATE_LIMIT_WEEKLY)
    return {
        dailyLimit: Number.isFinite(envDaily) && envDaily > 0 ? envDaily : DEFAULT_FREE_LIMIT.dailyLimit,
        weeklyLimit: Number.isFinite(envWeekly) && envWeekly > 0 ? envWeekly : DEFAULT_FREE_LIMIT.weeklyLimit,
    }
}

// In-memory fallback quando Supabase falha
const dailyCounts = new Map<string, { count: number; resetAt: number }>()
const weeklyCounts = new Map<string, { count: number; resetAt: number }>()

function getDayReset(): number {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return tomorrow.getTime()
}

function getWeekReset(): number {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday)
    return monday.getTime()
}

export interface UsageCheck {
    allowed: boolean
    dailyUsed: number
    dailyLimit: number
    weeklyUsed: number
    weeklyLimit: number
    reason?: string
}

/**
 * Verifica se usuário está dentro do limite.
 * Sempre retorna allowed=true se Supabase falhar (fail-open).
 */
export async function checkUsageLimit(
    userId: string,
    supabaseQuerier?: (userId: string, since: string) => Promise<number>,
): Promise<UsageCheck> {
    const config = getRateLimitForUser()
    const now = Date.now()
    const dayReset = getDayReset()
    const weekReset = getWeekReset()

    // Tenta Supabase primeiro
    let dailyUsed = 0
    let weeklyUsed = 0
    let dbOk = false

    if (supabaseQuerier) {
        try {
            const daySince = new Date(now - 86400000).toISOString()
            const weekSince = new Date(now - 604800000).toISOString()

            dailyUsed = await supabaseQuerier(userId, daySince)
            weeklyUsed = await supabaseQuerier(userId, weekSince)
            dbOk = true
        } catch {
            // Fallback para in-memory
        }
    }

    if (!dbOk) {
        const day = dailyCounts.get(userId)
        if (day && now < day.resetAt) {
            dailyUsed = day.count
        } else {
            dailyCounts.set(userId, { count: 0, resetAt: dayReset })
        }

        const week = weeklyCounts.get(userId)
        if (week && now < week.resetAt) {
            weeklyUsed = week.count
        } else {
            weeklyCounts.set(userId, { count: 0, resetAt: weekReset })
        }
    }

    if (dailyUsed >= config.dailyLimit) {
        return {
            allowed: false,
            dailyUsed,
            dailyLimit: config.dailyLimit,
            weeklyUsed,
            weeklyLimit: config.weeklyLimit,
            reason: `Limite diário de ${config.dailyLimit} análises atingido. Tente novamente amanhã.`,
        }
    }

    if (weeklyUsed >= config.weeklyLimit) {
        return {
            allowed: false,
            dailyUsed,
            dailyLimit: config.dailyLimit,
            weeklyUsed,
            weeklyLimit: config.weeklyLimit,
            reason: `Limite semanal de ${config.weeklyLimit} análises atingido.`,
        }
    }

    return {
        allowed: true,
        dailyUsed,
        dailyLimit: config.dailyLimit,
        weeklyUsed,
        weeklyLimit: config.weeklyLimit,
    }
}

/**
 * Incrementa contador in-memory após análise bem-sucedida.
 */
export function incrementUsageCounter(userId: string): void {
    const now = Date.now()
    const day = dailyCounts.get(userId)
    if (day && now < day.resetAt) {
        dailyCounts.set(userId, { count: day.count + 1, resetAt: day.resetAt })
    } else {
        dailyCounts.set(userId, { count: 1, resetAt: getDayReset() })
    }

    const week = weeklyCounts.get(userId)
    if (week && now < week.resetAt) {
        weeklyCounts.set(userId, { count: week.count + 1, resetAt: week.resetAt })
    } else {
        weeklyCounts.set(userId, { count: 1, resetAt: getWeekReset() })
    }
}

/**
 * Retorna percentual de uso para alertas (0-100).
 */
export function usagePercent(dailyUsed: number, dailyLimit: number): number {
    if (dailyLimit <= 0) return 100
    return Math.round((dailyUsed / dailyLimit) * 100)
}

export function shouldAlert(percent: number): boolean {
    return percent >= 80
}
