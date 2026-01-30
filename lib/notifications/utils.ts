/**
 * Notification Utilities
 *
 * Shared helper functions for notification processing
 */

import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get date range for a specific offset from base date
 * Useful for finding users with trial/subscription ending on specific days
 */
export function getDateRange(base: Date, offsetDays: number) {
  const start = new Date(base)
  start.setDate(start.getDate() + offsetDays)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Find users who have been inactive for a certain number of days
 * Based on their last WhatsApp conversation activity
 */
export async function findInactiveUsers(
  supabase: SupabaseClient,
  daysInactive: number,
  windowDays: number = 1 // Default 1-day window to avoid re-sending
) {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysInactive)

  // For longer inactivity periods, use a window to avoid re-notifying
  const windowEnd = new Date(threshold)
  windowEnd.setDate(windowEnd.getDate() + windowDays)

  const { data: conversations } = await supabase
    .from("whatsapp_conversations")
    .select("user_id")
    .lt("last_message_at", threshold.toISOString())
    .gte("last_message_at", new Date(threshold.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString())
    .not("user_id", "is", null)

  if (!conversations?.length) return []

  const userIds = [...new Set(conversations.map(c => c.user_id).filter(Boolean))]

  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, email")
    .in("id", userIds)
    .not("whatsapp", "is", null)

  return profiles || []
}

/**
 * Find users at a specific pipeline stage
 */
export async function findUsersByPipelineStage(
  supabase: SupabaseClient,
  stage: string
) {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, email")
    .eq("pipeline_stage", stage)
    .not("whatsapp", "is", null)

  return profiles || []
}

/**
 * Find users with trial/subscription expiring within a date range
 */
export async function findExpiringUsers(
  supabase: SupabaseClient,
  dateField: "trial_ends_at" | "expires_at",
  startDate: Date,
  endDate: Date,
  planFilter?: { field: string; value: string; operator: "eq" | "neq" }
) {
  let query = supabase
    .from("profiles")
    .select("id, name, whatsapp, email, trial_ends_at, expires_at")
    .gte(dateField, startDate.toISOString())
    .lte(dateField, endDate.toISOString())

  if (planFilter) {
    if (planFilter.operator === "eq") {
      query = query.eq(planFilter.field, planFilter.value)
    } else {
      query = query.neq(planFilter.field, planFilter.value)
    }
  }

  const { data: profiles } = await query

  return profiles || []
}

/**
 * Calculate results from a batch of notification sends
 */
export function calculateResults(results: Array<{ success: boolean }>) {
  const sent = results.filter(r => r.success).length
  return {
    total: results.length,
    sent,
    failed: results.length - sent
  }
}

/**
 * Profile type for notification targets
 */
export interface NotificationProfile {
  id: string
  name: string | null
  whatsapp: string | null
  email?: string | null
}

/**
 * Result type for batch processing
 */
export interface ProcessResult {
  userId: string
  status: string
  template: string
  channel: string
}
