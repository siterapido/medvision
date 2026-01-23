
import { NextRequest, NextResponse } from 'next/server'
import { uploadChatImage } from '@/lib/bunny/upload'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Para desenvolvimento sem login poder funcionar se necessário, 
        // comente o return abaixo. Mas em produção deve ter user.
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Fallback ID for dev if no user
    const userId = user?.id || 'dev-user'

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Usamos o helper do Bunny que já existe
        const result = await uploadChatImage(file, userId)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({ url: result.url })
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
