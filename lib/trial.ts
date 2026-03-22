import { addDays, differenceInDays, isAfter, isBefore, parseISO } from "date-fns"

export const TRIAL_OPTIONS = [1, 3, 7, 30] as const

export type TrialOption = (typeof TRIAL_OPTIONS)[number]

export const DEFAULT_TRIAL_DAYS: TrialOption = 7

export function normalizeTrialDays(value?: number | null, fallback = DEFAULT_TRIAL_DAYS): TrialOption {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback

  const rounded = Math.max(1, Math.floor(parsed))
  const allowed = TRIAL_OPTIONS.find((days) => days === rounded)

  return allowed ?? fallback
}

/**
 * Calcula a data de término do trial com base na data de início
 * @param startDate Data de início do trial
 * @param days Duração do trial em dias (default 7)
 * @returns Data de término do trial
 */
export function calculateTrialEndDate(startDate: Date, days: number = DEFAULT_TRIAL_DAYS): Date {
  return addDays(startDate, normalizeTrialDays(days))
}

/**
 * Retorna o número de dias restantes do trial
 * @param endsAt Data de término do trial (string ISO ou Date)
 * @returns Número de dias restantes (0 se expirado)
 */
export function getRemainingTrialDays(endsAt: string | Date | null | undefined): number {
  if (!endsAt) return 0
  
  const end = typeof endsAt === "string" ? parseISO(endsAt) : endsAt
  const now = new Date()
  
  if (isBefore(end, now)) return 0
  
  const days = differenceInDays(end, now)
  return days === 0 ? 1 : days
}

/**
 * Descobre quantos dias de trial estavam previstos a partir das datas salvas
 */
export function getTrialDurationFromDates(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined,
  fallback = DEFAULT_TRIAL_DAYS
): number {
  if (!startAt || !endAt) return fallback

  const start = typeof startAt === "string" ? parseISO(startAt) : startAt
  const end = typeof endAt === "string" ? parseISO(endAt) : endAt

  const duration = differenceInDays(end, start)

  if (duration <= 0) return fallback

  return duration
}

/**
 * Verifica se o trial está ativo
 * @param endsAt Data de término do trial
 * @returns true se o trial estiver ativo, false caso contrário
 */
export function isTrialActive(endsAt: string | Date | null | undefined): boolean {
  if (!endsAt) return false
  
  const end = typeof endsAt === "string" ? parseISO(endsAt) : endsAt
  const now = new Date()
  
  return isAfter(end, now)
}

/**
 * Verifica se o trial expirou
 * @param endsAt Data de término do trial
 * @returns true se o trial expirou, false caso contrário
 */
export function isTrialExpired(endsAt: string | Date | null | undefined): boolean {
  if (!endsAt) return true
  
  const end = typeof endsAt === "string" ? parseISO(endsAt) : endsAt
  const now = new Date()
  
  return isBefore(end, now)
}












