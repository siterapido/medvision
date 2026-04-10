import { createClient } from '@/lib/supabase/server'
import { getSql } from '@/lib/db/pool'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin' && profile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const sql = getSql()
        const certificates = await sql.query(`
          SELECT c.*,
            json_build_object('name', p.name, 'email', p.email) AS profile,
            json_build_object('title', co.title) AS course
          FROM public.certificates c
          LEFT JOIN public.profiles p ON p.id = c.user_id
          LEFT JOIN public.courses co ON co.id = c.course_id
          ORDER BY c.created_at DESC NULLS LAST
        `, [])

        return NextResponse.json(certificates)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await req.json()
        const { user_id, course_id, hours, certificate_url } = body

        if (!user_id || !hours || !certificate_url) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('certificates')
            .insert({
                user_id,
                course_id,
                hours,
                certificate_url,
                issue_date: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating certificate:', error)
            return NextResponse.json({ error: 'Erro ao emitir certificado' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
