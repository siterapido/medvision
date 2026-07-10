import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { recordLaudoAudit } from '@/lib/laudos/audit'

type RouteContext = { params: Promise<{ id: string }> }

const auditBodySchema = z.object({
  action: z.enum(['exported', 'viewed', 'edited']),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * POST /api/laudos/[id]/audit
 * Registra evento de auditoria (exported / viewed / edited).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: artifactId } = await context.params
    if (!artifactId) {
      return NextResponse.json({ error: 'Artifact id required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = auditBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.errors },
        { status: 400 },
      )
    }

    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id')
      .eq('id', artifactId)
      .eq('user_id', user.id)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json({ error: 'Laudo não encontrado' }, { status: 404 })
    }

    await recordLaudoAudit({
      artifactId,
      userId: user.id,
      action: parsed.data.action,
      metadata: parsed.data.metadata ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API /laudos/audit]', error)
    return NextResponse.json({ error: 'Falha ao registrar auditoria' }, { status: 500 })
  }
}
