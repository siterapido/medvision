/**
 * WhatsApp automatic triggers system
 * Sends automated messages based on user events and status changes
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppResponse } from './send-response'

type SupabaseAdmin = ReturnType<typeof createAdminClient>

/**
 * Check and send triggers for user events
 * Called periodically by cron job
 *
 * Uses createAdminClient (service role) because cron jobs run
 * without a user session - cookie-based auth won't work here.
 */
export async function checkAndSendTriggers() {
  const supabase = createAdminClient()

  console.log('[WhatsApp Triggers] Starting trigger check...')

  try {
    // 1. Check trial expiring (3 days before)
    await checkTrialExpiringTrigger(supabase)

    // 2. Check trial expired (recovery)
    await checkTrialExpiredTrigger(supabase)

    // 3. Check new courses published
    await checkNewCoursesTrigger(supabase)

    console.log('[WhatsApp Triggers] Trigger check completed successfully')
  } catch (error) {
    console.error('[WhatsApp Triggers] Error in trigger check:', error)
    throw error
  }
}

/**
 * Trial expiring trigger - 3 days before expiration
 */
async function checkTrialExpiringTrigger(supabase: SupabaseAdmin) {
  console.log('[Triggers] Checking trial expiring...')

  // Calculate date range: expiring in 3 days
  const now = new Date()
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  const { data: usersWithExpiringTrial, error } = await supabase
    .from('profiles')
    .select('id, name, whatsapp, trial_ends_at')
    .eq('subscription_status', 'trial')
    .gte('trial_ends_at', inThreeDays.toISOString())
    .lte('trial_ends_at', inFourDays.toISOString())
    .eq('whatsapp_optin', true)
    .not('whatsapp', 'is', null)

  if (error) {
    console.error('[Triggers] Error fetching trial expiring users:', error)
    return
  }

  console.log(`[Triggers] Found ${usersWithExpiringTrial?.length || 0} users with expiring trial`)

  for (const user of usersWithExpiringTrial || []) {
    const daysLeft = Math.ceil(
      (new Date(user.trial_ends_at!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )

    const message = `🔔 *Olá ${user.name}*!

Seu período de teste do Odonto GPT termina em *${daysLeft} dias*.

Para continuar com acesso ilimitado:
📱 Acesse: https://odontogpt.com.br/checkout

Dúvidas? É só responder aqui! 😊`

    try {
      await sendWhatsAppResponse(user.whatsapp!, message)

      // Log the notification
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        channel: 'whatsapp',
        template_name: 'trial_expiring',
        content: `Trial expirando em ${daysLeft} dias`,
        status: 'sent',
      })

      console.log(`[Triggers] Trial expiring message sent to ${user.whatsapp}`)
    } catch (error) {
      console.error(`[Triggers] Error sending trial expiring message to ${user.whatsapp}:`, error)

      // Log the failure
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        channel: 'whatsapp',
        template_name: 'trial_expiring',
        content: `Trial expirando em ${daysLeft} dias`,
        status: 'failed',
      })
    }
  }
}

/**
 * Trial expired trigger - recovery offer
 */
async function checkTrialExpiredTrigger(supabase: SupabaseAdmin) {
  console.log('[Triggers] Checking trial expired...')

  // Check if last notification was sent less than 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Find users whose trial expired without converting and haven't been messaged recently
  const { data: usersWithExpiredTrial, error } = await supabase
    .from('profiles')
    .select('id, name, whatsapp, trial_ends_at, updated_at')
    .eq('subscription_status', 'trial')
    .lt('trial_ends_at', new Date().toISOString())
    .eq('whatsapp_optin', true)
    .not('whatsapp', 'is', null)

  if (error) {
    console.error('[Triggers] Error fetching expired trial users:', error)
    return
  }

  console.log(`[Triggers] Found ${usersWithExpiredTrial?.length || 0} users with expired trial`)

  for (const user of usersWithExpiredTrial || []) {
    // Check if we already sent a recovery message recently
    const { data: recentMessage } = await supabase
      .from('notification_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('template_name', 'trial_expired_recovery')
      .gte('created_at', sevenDaysAgo)
      .limit(1)
      .maybeSingle()

    if (recentMessage) {
      console.log(`[Triggers] Recovery message already sent to ${user.whatsapp} recently, skipping`)
      continue
    }

    const message = `💙 *${user.name}*, sentimos sua falta!

Vimos que seu teste do Odonto GPT terminou.

🎁 *Oferta especial:* 20% de desconto se assinar hoje!

👉 https://odontogpt.com.br/checkout?coupon=VOLTA20

Podemos te ajudar com algo? 📚`

    try {
      await sendWhatsAppResponse(user.whatsapp!, message)

      // Log the notification
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        channel: 'whatsapp',
        template_name: 'trial_expired_recovery',
        content: 'Oferta especial - trial expirado',
        status: 'sent',
      })

      // Update pipeline status if exists
      await supabase.from('pipeline').upsert({
        user_id: user.id,
        stage: 'risco_churn',
        last_contact_at: new Date().toISOString(),
      })

      console.log(`[Triggers] Trial expired recovery message sent to ${user.whatsapp}`)
    } catch (error) {
      console.error(`[Triggers] Error sending recovery message to ${user.whatsapp}:`, error)

      await supabase.from('notification_logs').insert({
        user_id: user.id,
        channel: 'whatsapp',
        template_name: 'trial_expired_recovery',
        content: 'Oferta especial - trial expirado',
        status: 'failed',
      })
    }
  }
}

/**
 * New course published trigger
 */
async function checkNewCoursesTrigger(supabase: SupabaseAdmin) {
  console.log('[Triggers] Checking new courses...')

  // Find courses published in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: newCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .gte('created_at', oneDayAgo)
    .eq('is_published', true)

  if (coursesError) {
    console.error('[Triggers] Error fetching new courses:', coursesError)
    return
  }

  if (!newCourses || newCourses.length === 0) {
    console.log('[Triggers] No new courses found')
    return
  }

  console.log(`[Triggers] Found ${newCourses.length} new course(s)`)

  // Find active users with WhatsApp opt-in
  const { data: activeUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, name, whatsapp')
    .eq('subscription_status', 'active')
    .eq('whatsapp_optin', true)
    .not('whatsapp', 'is', null)

  if (usersError) {
    console.error('[Triggers] Error fetching active users:', usersError)
    return
  }

  console.log(`[Triggers] Found ${activeUsers?.length || 0} active users`)

  // Send message for each course to each user
  for (const course of newCourses) {
    for (const user of activeUsers || []) {
      // Check if message was already sent
      const { data: existingMessage } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('template_name', 'new_course')
        .contains('metadata', { course_id: course.id })
        .limit(1)
        .maybeSingle()

      if (existingMessage) {
        console.log(`[Triggers] New course message already sent to ${user.whatsapp} for course ${course.id}`)
        continue
      }

      const message = `🎓 *Novo curso disponível!*

*${course.title}*

Acesse agora em:
👉 https://odontogpt.com.br/dashboard/cursos/${course.id}

Bons estudos! 📚`

      try {
        await sendWhatsAppResponse(user.whatsapp!, message)

        // Log the notification
        await supabase.from('notification_logs').insert({
          user_id: user.id,
          channel: 'whatsapp',
          template_name: 'new_course',
          content: `Novo curso: ${course.title}`,
          status: 'sent',
          metadata: { course_id: course.id },
        })

        console.log(`[Triggers] New course message sent to ${user.whatsapp}`)
      } catch (error) {
        console.error(`[Triggers] Error sending new course message to ${user.whatsapp}:`, error)

        await supabase.from('notification_logs').insert({
          user_id: user.id,
          channel: 'whatsapp',
          template_name: 'new_course',
          content: `Novo curso: ${course.title}`,
          status: 'failed',
          metadata: { course_id: course.id },
        })
      }
    }
  }
}
