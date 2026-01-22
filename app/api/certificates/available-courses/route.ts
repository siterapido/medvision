import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Get courses where user has progress (for now let's just show all courses or those started)
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, title')
            .eq('published', true)

        if (error) {
            console.error('Error fetching available courses:', error)
            return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
        }

        return NextResponse.json(courses)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
