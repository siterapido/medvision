/**
 * Cron Job: Daily Notifications (9h)
 *
 * Sends automated notifications for:
 * 1. Trial warning (3 days left)
 * 2. Trial expired
 * 3. Subscription expiring (3 days)
 * 4. Subscription expired
 * 5. Re-engagement: churn risk
 * 6. Re-engagement: inactive (3+ days)
 * 7. Re-engagement: long inactive (7+ days)
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getTemplateByName,
  processTemplate,
  sendNotification,
  getDateRange,
  findExpiringUsers,
  findUsersByPipelineStage,
  findInactiveUsers,
  type ProcessResult,
  type NotificationProfile,
} from "@/lib/notifications"

export const dynamic = "force-dynamic"
/** Lote grande de notificações: margem além do default (10s) */
export const maxDuration = 120

type Channel = "whatsapp" | "email"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron notifications] Tentativa de acesso não autorizado")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: ProcessResult[] = []
  const now = new Date()

  // Date ranges
  const { start: todayStart, end: todayEnd } = getDateRange(now, 0)
  const { start: yesterdayStart, end: yesterdayEnd } = getDateRange(now, -1)
  const { start: threeDaysStart, end: threeDaysEnd } = getDateRange(now, 3)

  try {
    // --- Helper to process notifications ---
    const processBatch = async (
      users: NotificationProfile[],
      templateName: string,
      channel: Channel,
      checkDuplicate = true
    ) => {
      if (!users || users.length === 0) return

      let template
      try {
        template = await getTemplateByName(templateName)
      } catch {
        console.error(`Template ${templateName} not found`)
        return
      }

      for (const user of users) {
        if (checkDuplicate) {
          const { data: existingLog } = await supabase
            .from("notification_logs")
            .select("id")
            .eq("user_id", user.id)
            .eq("template_id", template.id)
            .gte("sent_at", todayStart.toISOString())
            .single()

          if (existingLog) {
            results.push({
              userId: user.id,
              status: "skipped_already_sent",
              template: templateName,
              channel,
            })
            continue
          }
        }

        const message = processTemplate(template.content, {
          name: user.name || "Cliente",
        })

        const res = await sendNotification(
          user.id,
          message,
          channel,
          template.id,
          template.subject
            ? processTemplate(template.subject, { name: user.name || "Cliente" })
            : undefined
        )

        results.push({
          userId: user.id,
          status: res.success ? "sent" : "failed",
          template: templateName,
          channel,
        })
      }
    }

    // 1. TRIAL WARNING (3 Days Left)
    const trialWarningUsers = await findExpiringUsers(
      supabase,
      "trial_ends_at",
      threeDaysStart,
      threeDaysEnd,
      { field: "plan_type", value: "free", operator: "eq" }
    )

    await processBatch(
      trialWarningUsers.filter(u => u.whatsapp),
      "trial_warning_3_days",
      "whatsapp"
    )
    await processBatch(
      trialWarningUsers.filter(u => u.email),
      "trial_warning_3_days_email",
      "email"
    )

    // 2. TRIAL EXPIRED (Yesterday to Today)
    const trialExpiredUsers = await findExpiringUsers(
      supabase,
      "trial_ends_at",
      yesterdayStart,
      todayEnd,
      { field: "plan_type", value: "free", operator: "eq" }
    )

    await processBatch(
      trialExpiredUsers.filter(u => u.whatsapp),
      "trial_expired",
      "whatsapp"
    )
    await processBatch(
      trialExpiredUsers.filter(u => u.email),
      "trial_expired_email",
      "email"
    )

    // 3. SUBSCRIPTION EXPIRING (3 Days)
    const subExpiringUsers = await findExpiringUsers(
      supabase,
      "expires_at",
      threeDaysStart,
      threeDaysEnd,
      { field: "plan_type", value: "free", operator: "neq" }
    )

    await processBatch(
      subExpiringUsers.filter(u => u.whatsapp),
      "subscription_expiring_3_days",
      "whatsapp"
    )
    await processBatch(
      subExpiringUsers.filter(u => u.email),
      "subscription_expiring_3_days_email",
      "email"
    )

    // 4. SUBSCRIPTION EXPIRED (Yesterday to Today)
    const subExpiredUsers = await findExpiringUsers(
      supabase,
      "expires_at",
      yesterdayStart,
      todayEnd,
      { field: "plan_type", value: "free", operator: "neq" }
    )

    await processBatch(
      subExpiredUsers.filter(u => u.whatsapp),
      "subscription_expired",
      "whatsapp"
    )
    await processBatch(
      subExpiredUsers.filter(u => u.email),
      "subscription_expired_email",
      "email"
    )

    // 5. RE-ENGAGEMENT: CHURN RISK
    const churnRiskUsers = await findUsersByPipelineStage(supabase, "risco_churn")
    await processBatch(churnRiskUsers, "reengagement_churn_risk", "whatsapp")

    // 6. RE-ENGAGEMENT: INACTIVE (3+ days)
    const inactiveUsers = await findInactiveUsers(supabase, 3, 1)
    await processBatch(inactiveUsers, "reengagement_inactive", "whatsapp")

    // 7. RE-ENGAGEMENT: LONG INACTIVE (7+ days)
    const longInactiveUsers = await findInactiveUsers(supabase, 7, 1)
    await processBatch(longInactiveUsers, "reengagement_inactive_7days", "whatsapp")

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Cron Error:", err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
