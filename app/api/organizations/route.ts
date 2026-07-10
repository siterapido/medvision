import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createOrgSchema = z.object({
  name: z.string().trim().min(1).max(200),
})

/**
 * GET /api/organizations
 * Lista clínicas (organizations) das quais o usuário é membro.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: memberships, error: memError } = await supabase
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', user.id)

    if (memError) {
      console.error('[API /organizations GET] members:', memError)
      return NextResponse.json({ error: 'Falha ao listar clínicas' }, { status: 500 })
    }

    const orgIds = (memberships || []).map((m) => m.org_id as string)
    if (orgIds.length === 0) {
      return NextResponse.json({ organizations: [] })
    }

    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .in('id', orgIds)

    if (orgError) {
      console.error('[API /organizations GET] orgs:', orgError)
      return NextResponse.json({ error: 'Falha ao listar clínicas' }, { status: 500 })
    }

    const roleByOrg = new Map(
      (memberships || []).map((m) => [m.org_id as string, m.role as string]),
    )

    const organizations = (orgs || []).map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.created_at,
      role: roleByOrg.get(org.id) ?? 'medico',
    }))

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('[API /organizations GET]', error)
    return NextResponse.json({ error: 'Falha ao listar clínicas' }, { status: 500 })
  }
}

/**
 * POST /api/organizations
 * Cria clínica e associa o usuário como admin.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = createOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.errors },
        { status: 400 },
      )
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: parsed.data.name })
      .select('id, name, created_at')
      .single()

    if (orgError || !org) {
      console.error('[API /organizations POST] create:', orgError)
      return NextResponse.json({ error: 'Falha ao criar clínica' }, { status: 500 })
    }

    const { error: memError } = await supabase.from('organization_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'admin',
    })

    if (memError) {
      console.error('[API /organizations POST] membership:', memError)
      return NextResponse.json({ error: 'Falha ao associar membro' }, { status: 500 })
    }

    return NextResponse.json(
      {
        organization: {
          id: org.id,
          name: org.name,
          createdAt: org.created_at,
          role: 'admin',
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[API /organizations POST]', error)
    return NextResponse.json({ error: 'Falha ao criar clínica' }, { status: 500 })
  }
}
