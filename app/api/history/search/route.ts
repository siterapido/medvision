/**
 * API Route: Chat History Search
 *
 * GET: Full-text search across chat sessions and messages
 * Supports filtering by agent, date range, and text query
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface ChatSearchResult {
  id: string
  title: string
  agentType: string
  createdAt: string
  updatedAt: string
  snippet: string | null
  messageCount: number
}

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
    const query = searchParams.get('q') || ''
    const agentId = searchParams.get('agent')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build base query for sessions
    let sessionsQuery = supabase
      .from('agent_sessions')
      .select(`
        id,
        title,
        agent_type,
        created_at,
        updated_at,
        metadata,
        agent_messages!inner(id, content, role)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply agent filter
    if (agentId) {
      sessionsQuery = sessionsQuery.eq('agent_type', agentId)
    }

    // Apply date range filters
    if (from) {
      sessionsQuery = sessionsQuery.gte('created_at', from)
    }
    if (to) {
      sessionsQuery = sessionsQuery.lte('created_at', to)
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery

    if (sessionsError) {
      console.error('[History Search] Sessions error:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to search sessions' },
        { status: 500 }
      )
    }

    // Filter and format results
    const results: ChatSearchResult[] = []

    for (const session of sessions || []) {
      const messages = session.agent_messages || []
      let matchedSnippet: string | null = null

      if (query) {
        // Check if title matches
        const titleMatch = (session.metadata?.title || session.title || '')
          .toLowerCase()
          .includes(query.toLowerCase())

        // Check if any message content matches
        const matchingMessage = messages.find((msg: any) =>
          msg.content?.toLowerCase().includes(query.toLowerCase())
        )

        if (!titleMatch && !matchingMessage) {
          continue // Skip if no match found
        }

        // Extract snippet from matching message
        if (matchingMessage) {
          const content = matchingMessage.content as string
          const lowerContent = content.toLowerCase()
          const lowerQuery = query.toLowerCase()
          const matchIndex = lowerContent.indexOf(lowerQuery)

          if (matchIndex !== -1) {
            const start = Math.max(0, matchIndex - 40)
            const end = Math.min(content.length, matchIndex + query.length + 60)
            matchedSnippet = (start > 0 ? '...' : '') +
              content.slice(start, end) +
              (end < content.length ? '...' : '')
          }
        }
      }

      results.push({
        id: session.id,
        title: session.metadata?.title || session.title || 'Nova Conversa',
        agentType: session.agent_type,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        snippet: matchedSnippet,
        messageCount: messages.length,
      })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('agent_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (agentId) {
      countQuery = countQuery.eq('agent_type', agentId)
    }
    if (from) {
      countQuery = countQuery.gte('created_at', from)
    }
    if (to) {
      countQuery = countQuery.lte('created_at', to)
    }

    const { count } = await countQuery

    return NextResponse.json({
      results,
      total: count || 0,
      hasMore: (offset + results.length) < (count || 0),
    })
  } catch (error) {
    console.error('[History Search] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search chat history' },
      { status: 500 }
    )
  }
}
