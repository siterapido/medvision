import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*, profile:profiles(name, email), course:courses(title)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching certificates:', error)
            return NextResponse.json({ error: 'Erro ao buscar certificados' }, { status: 500 })
        }

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
