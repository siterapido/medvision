import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*, course:courses(title)')
            .eq('user_id', user.id)
            .order('issue_date', { ascending: false })

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
