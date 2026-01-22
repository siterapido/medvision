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

        const { data: requests, error } = await supabase
            .from('certificate_requests')
            .select('*, profile:profiles(name, email), course:courses(title)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching requests:', error)
            return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 })
        }

        return NextResponse.json(requests)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
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
        const { id, status, admin_notes } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'ID e status são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('certificate_requests')
            .update({ status, admin_notes })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating request:', error)
            return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
