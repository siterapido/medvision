import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: requests, error } = await supabase
            .from('certificate_requests')
            .select('*, course:courses(title)')
            .eq('user_id', user.id)
            .order('request_date', { ascending: false })

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

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { course_id } = await req.json()

        if (!course_id) {
            return NextResponse.json({ error: 'ID do curso é obrigatório' }, { status: 400 })
        }

        // Check if a request already exists
        const { data: existingRequest } = await supabase
            .from('certificate_requests')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course_id)
            .single()

        if (existingRequest) {
            return NextResponse.json({ error: 'Você já possui uma solicitação para este curso' }, { status: 400 })
        }

        // Check if certificate already exists
        const { data: existingCert } = await supabase
            .from('certificates')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course_id)
            .single()

        if (existingCert) {
            return NextResponse.json({ error: 'Você já possui um certificado para este curso' }, { status: 400 })
        }

        const { error } = await supabase
            .from('certificate_requests')
            .insert({
                user_id: user.id,
                course_id,
                status: 'pending'
            })

        if (error) {
            console.error('Error creating certificate request:', error)
            return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Solicitação criada com sucesso' })
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
