/**
 * Database Queries - Supabase Adapter
 *
 * This module provides database query functions compatible with the
 * Vercel AI Chatbot patterns, adapted for Supabase.
 */

import { createClient } from '@/lib/supabase/server'

export interface Chat {
  id: string
  createdAt: Date
  title: string
  userId: string
  visibility: 'public' | 'private'
  agentType?: string
  status?: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
  createdAt: Date
}

/**
 * Get all chats for a user
 */
export async function getChats(userId: string): Promise<Chat[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[getChats] Error:', error)
    return []
  }

  return (data || []).map((session) => ({
    id: session.id,
    createdAt: new Date(session.created_at),
    title: session.metadata?.title || session.title || 'Nova Conversa',
    userId: session.user_id,
    visibility: 'private' as const,
    agentType: session.agent_type,
    status: session.status,
    metadata: session.metadata,
  }))
}

/**
 * Get paginated chats for a user
 */
export async function getChatsPaginated(
  userId: string,
  options: { limit?: number; endingBefore?: string }
): Promise<{ chats: Chat[]; hasMore: boolean }> {
  const supabase = await createClient()
  const limit = options.limit || 20

  let query = supabase
    .from('agent_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (options.endingBefore) {
    const { data: cursorChat } = await supabase
      .from('agent_sessions')
      .select('created_at')
      .eq('id', options.endingBefore)
      .single()

    if (cursorChat) {
      query = query.lt('created_at', cursorChat.created_at)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('[getChatsPaginated] Error:', error)
    return { chats: [], hasMore: false }
  }

  const hasMore = data && data.length > limit
  const chats = (data || []).slice(0, limit).map((session) => ({
    id: session.id,
    createdAt: new Date(session.created_at),
    title: session.metadata?.title || session.title || 'Nova Conversa',
    userId: session.user_id,
    visibility: 'private' as const,
    agentType: session.agent_type,
    status: session.status,
    metadata: session.metadata,
  }))

  return { chats, hasMore }
}

/**
 * Get a chat by ID
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error || !data) {
    console.error('[getChatById] Error:', error)
    return null
  }

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    title: data.metadata?.title || data.title || 'Nova Conversa',
    userId: data.user_id,
    visibility: 'private',
    agentType: data.agent_type,
    status: data.status,
    metadata: data.metadata,
  }
}

/**
 * Get a chat with all messages
 */
export async function getChatWithMessages(chatId: string): Promise<{
  chat: Chat | null
  messages: Message[]
}> {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('agent_sessions')
    .select('*, agent_messages(*)')
    .eq('id', chatId)
    .single()

  if (sessionError || !session) {
    console.error('[getChatWithMessages] Error:', sessionError)
    return { chat: null, messages: [] }
  }

  const chat: Chat = {
    id: session.id,
    createdAt: new Date(session.created_at),
    title: session.metadata?.title || session.title || 'Nova Conversa',
    userId: session.user_id,
    visibility: 'private',
    agentType: session.agent_type,
    status: session.status,
    metadata: session.metadata,
  }

  const messages: Message[] = (session.agent_messages || [])
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((msg: any) => ({
      id: msg.id,
      sessionId: msg.session_id,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
      createdAt: new Date(msg.created_at),
    }))

  return { chat, messages }
}

/**
 * Delete a chat (soft delete - sets status to 'deleted')
 */
export async function deleteChat(chatId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('agent_sessions')
    .update({ status: 'deleted' })
    .eq('id', chatId)
    .eq('user_id', userId)

  if (error) {
    console.error('[deleteChat] Error:', error)
    return false
  }

  return true
}

/**
 * Delete all chats for a user (soft delete)
 */
export async function deleteAllChats(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('agent_sessions')
    .update({ status: 'deleted' })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('[deleteAllChats] Error:', error)
    return false
  }

  return true
}

/**
 * Update chat title
 */
export async function updateChatTitle(
  chatId: string,
  userId: string,
  title: string
): Promise<boolean> {
  const supabase = await createClient()

  // First get the current metadata
  const { data: current } = await supabase
    .from('agent_sessions')
    .select('metadata')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('agent_sessions')
    .update({
      metadata: { ...(current?.metadata || {}), title },
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)
    .eq('user_id', userId)

  if (error) {
    console.error('[updateChatTitle] Error:', error)
    return false
  }

  return true
}

/**
 * Create a new chat session
 */
export async function createChat(
  userId: string,
  options: {
    title?: string
    agentType?: string
    metadata?: Record<string, any>
  }
): Promise<Chat | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({
      user_id: userId,
      agent_type: options.agentType || 'qa',
      status: 'active',
      metadata: {
        title: options.title || 'Nova Conversa',
        ...options.metadata,
      },
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[createChat] Error:', error)
    return null
  }

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    title: data.metadata?.title || 'Nova Conversa',
    userId: data.user_id,
    visibility: 'private',
    agentType: data.agent_type,
    status: data.status,
    metadata: data.metadata,
  }
}

/**
 * Save a message to a chat
 */
export async function saveMessage(
  sessionId: string,
  message: {
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata?: Record<string, any>
    agentId?: string
  }
): Promise<Message | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      agent_id: message.agentId,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[saveMessage] Error:', error)
    return null
  }

  // Update session updated_at
  await supabase
    .from('agent_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  return {
    id: data.id,
    sessionId: data.session_id,
    role: data.role,
    content: data.content,
    metadata: data.metadata,
    createdAt: new Date(data.created_at),
  }
}

/**
 * Get messages for a chat session
 */
export async function getMessagesBySessionId(sessionId: string): Promise<Message[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getMessagesBySessionId] Error:', error)
    return []
  }

  return (data || []).map((msg) => ({
    id: msg.id,
    sessionId: msg.session_id,
    role: msg.role,
    content: msg.content,
    metadata: msg.metadata,
    createdAt: new Date(msg.created_at),
  }))
}

/**
 * Chat with preview - includes last few messages
 */
export interface ChatWithPreview extends Chat {
  preview: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  messageCount: number
}

/**
 * Search options for filtering chats
 */
export interface SearchOptions {
  query?: string
  agentId?: string
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}

/**
 * Search chats with full-text search on messages
 */
export async function searchChats(
  userId: string,
  options: SearchOptions
): Promise<{ chats: ChatWithPreview[]; total: number }> {
  const supabase = await createClient()
  const { query, agentId, from, to, limit = 20, offset = 0 } = options

  // Build query for sessions with their messages
  let sessionsQuery = supabase
    .from('agent_sessions')
    .select(`
      id,
      title,
      agent_type,
      created_at,
      updated_at,
      metadata,
      status,
      agent_messages(id, role, content, created_at)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (agentId) {
    sessionsQuery = sessionsQuery.eq('agent_type', agentId)
  }
  if (from) {
    sessionsQuery = sessionsQuery.gte('created_at', from.toISOString())
  }
  if (to) {
    sessionsQuery = sessionsQuery.lte('created_at', to.toISOString())
  }

  const { data: sessions, error } = await sessionsQuery

  if (error) {
    console.error('[searchChats] Error:', error)
    return { chats: [], total: 0 }
  }

  // Filter by text search if query provided
  let filteredSessions = sessions || []
  if (query && query.length > 0) {
    const lowerQuery = query.toLowerCase()
    filteredSessions = filteredSessions.filter((session) => {
      const title = (session.metadata?.title || session.title || '').toLowerCase()
      if (title.includes(lowerQuery)) return true

      const messages = session.agent_messages || []
      return messages.some((msg: any) =>
        msg.content?.toLowerCase().includes(lowerQuery)
      )
    })
  }

  const total = filteredSessions.length
  const paginatedSessions = filteredSessions.slice(offset, offset + limit)

  const chats: ChatWithPreview[] = paginatedSessions.map((session) => {
    const messages = (session.agent_messages || [])
      .sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 3)
      .reverse()

    return {
      id: session.id,
      createdAt: new Date(session.created_at),
      title: session.metadata?.title || session.title || 'Nova Conversa',
      userId,
      visibility: 'private' as const,
      agentType: session.agent_type,
      status: session.status,
      metadata: session.metadata,
      preview: messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content?.slice(0, 150) || '',
      })),
      messageCount: (session.agent_messages || []).length,
    }
  })

  return { chats, total }
}

/**
 * Get a chat with preview messages
 */
export async function getChatWithPreview(
  chatId: string,
  userId: string
): Promise<ChatWithPreview | null> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('agent_sessions')
    .select(`
      id,
      title,
      agent_type,
      created_at,
      updated_at,
      metadata,
      status,
      user_id,
      agent_messages(id, role, content, created_at)
    `)
    .eq('id', chatId)
    .single()

  if (error || !session) {
    console.error('[getChatWithPreview] Error:', error)
    return null
  }

  if (session.user_id !== userId) {
    console.error('[getChatWithPreview] Unauthorized access attempt')
    return null
  }

  const messages = (session.agent_messages || [])
    .sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3)
    .reverse()

  return {
    id: session.id,
    createdAt: new Date(session.created_at),
    title: session.metadata?.title || session.title || 'Nova Conversa',
    userId: session.user_id,
    visibility: 'private' as const,
    agentType: session.agent_type,
    status: session.status,
    metadata: session.metadata,
    preview: messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content?.slice(0, 150) || '',
    })),
    messageCount: (session.agent_messages || []).length,
  }
}
