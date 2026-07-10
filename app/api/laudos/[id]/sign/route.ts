import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordLaudoAudit } from '@/lib/laudos/audit'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/laudos/[id]/sign
 * Assina o laudo com nome + CRM do perfil e registra audit trail.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
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

    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, user_id, signed_at')
      .eq('id', artifactId)
      .eq('user_id', user.id)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json({ error: 'Laudo não encontrado' }, { status: 404 })
    }

    if (artifact.signed_at) {
      return NextResponse.json({ error: 'Laudo já assinado' }, { status: 409 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, cro')
      .eq('id', user.id)
      .single()

    const signerName =
      (typeof profile?.name === 'string' && profile.name.trim()) ||
      user.email ||
      'Profissional'

    const signerCrm =
      typeof profile?.cro === 'string' && profile.cro.trim()
        ? profile.cro.trim()
        : null

    const signedAt = new Date().toISOString()

    const { data: signature, error: sigError } = await supabase
      .from('laudo_signatures')
      .insert({
        artifact_id: artifactId,
        user_id: user.id,
        signer_name: signerName,
        signer_crm: signerCrm,
        signed_at: signedAt,
      })
      .select()
      .single()

    if (sigError) {
      if (sigError.message?.includes('unique') || sigError.code === '23505') {
        return NextResponse.json({ error: 'Laudo já assinado' }, { status: 409 })
      }
      console.error('[API /laudos/sign] signature insert:', sigError)
      return NextResponse.json({ error: 'Falha ao assinar laudo' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('artifacts')
      .update({ signed_at: signedAt })
      .eq('id', artifactId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[API /laudos/sign] artifact update:', updateError)
      return NextResponse.json({ error: 'Falha ao atualizar laudo' }, { status: 500 })
    }

    await recordLaudoAudit({
      artifactId,
      userId: user.id,
      action: 'signed',
      metadata: { signerName, signerCrm },
    })

    return NextResponse.json({
      signature,
      signedAt,
      signerName,
      signerCrm,
    })
  } catch (error) {
    console.error('[API /laudos/sign]', error)
    return NextResponse.json({ error: 'Falha ao assinar laudo' }, { status: 500 })
  }
}
