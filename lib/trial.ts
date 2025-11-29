import { addDays, differenceInDays, isAfter, isBefore, parseISO } from "date-fns"

export const TRIAL_DAYS = 7

/**
 * Calcula a data de término do trial com base na data de início
 * @param startDate Data de início do trial
 * @returns Data de término do trial
 */
export function calculateTrialEndDate(startDate: Date): Date {
  return addDays(startDate, TRIAL_DAYS)
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
  
  return differenceInDays(end, now)
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

