/**
 * API Route: Chat Preview
 *
 * GET: Returns the last 3 messages from a chat session for quick preview
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface MessagePreview {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface ChatPreview {
  id: string
  title: string
  agentType: string
  createdAt: string
  messages: MessagePreview[]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Verify user owns this session
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('id, title, agent_type, created_at, metadata, user_id')
      .eq('id', chatId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get last 3 messages
    const { data: messages, error: messagesError } = await supabase
      .from('agent_messages')
      .select('id, role, content, created_at')
      .eq('session_id', chatId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (messagesError) {
      console.error('[Chat Preview] Messages error:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Reverse to get chronological order
    const orderedMessages = (messages || []).reverse()

    const preview: ChatPreview = {
      id: session.id,
      title: session.metadata?.title || session.title || 'Nova Conversa',
      agentType: session.agent_type,
      createdAt: session.created_at,
      messages: orderedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content?.slice(0, 200) + (msg.content?.length > 200 ? '...' : ''),
        createdAt: msg.created_at,
      })),
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error('[Chat Preview] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat preview' },
      { status: 500 }
    )
  }
}
