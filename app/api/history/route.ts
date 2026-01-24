/**
 * API Route: Chat History
 *
 * GET: Returns paginated chat history for the authenticated user
 * DELETE: Deletes all chats for the authenticated user
 */

import { createClient } from '@/lib/supabase/server'
import { getChatsPaginated, deleteAllChats } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const endingBefore = searchParams.get('ending_before') || undefined

    const result = await getChatsPaginated(user.id, {
      limit,
      endingBefore,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[History API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await deleteAllChats(user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete chats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[History API] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chats' },
      { status: 500 }
    )
  }
}
