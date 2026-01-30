/**
 * Cron job for WhatsApp automatic triggers
 * Runs every 4 hours to check and send automatic messages
 */

import { NextResponse } from 'next/server'
import { checkAndSendTriggers } from '@/lib/whatsapp/triggers'

export async function GET(request: Request) {
  // Verify CRON_SECRET for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized cron trigger attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting WhatsApp triggers check')

    await checkAndSendTriggers()

    console.log('[Cron] WhatsApp triggers check completed successfully')

    return NextResponse.json({
      success: true,
      message: 'WhatsApp triggers check completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Error in WhatsApp triggers:', error)

    return NextResponse.json(
      {
        error: 'Failed to process WhatsApp triggers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
