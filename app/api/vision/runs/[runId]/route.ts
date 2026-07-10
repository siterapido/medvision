import { getRun } from 'workflow/api'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300

type RouteContext = { params: Promise<{ runId: string }> }

/**
 * Poll / resume a durable vision analysis run.
 * GET → { status, result? }
 */
export async function GET(_req: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { runId } = await context.params
  if (!runId) {
    return NextResponse.json({ error: 'runId obrigatório' }, { status: 400 })
  }

  const run = getRun(runId)
  if (!(await run.exists)) {
    return NextResponse.json({ error: 'Run não encontrado' }, { status: 404 })
  }

  const status = await run.status

  if (status === 'completed') {
    try {
      const result = await run.returnValue
      return NextResponse.json({ status, result })
    } catch (err) {
      return NextResponse.json(
        {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Falha ao ler resultado',
        },
        { status: 500 },
      )
    }
  }

  if (status === 'failed' || status === 'cancelled') {
    return NextResponse.json({ status, error: `Run ${status}` }, { status: 500 })
  }

  return NextResponse.json({ status, runId })
}
