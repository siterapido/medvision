import { createClient } from '@/lib/supabase/server'

export interface Chat {
  id: string
  createdAt: Date
  title: string
  userId: string
  agentType?: string
  status?: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

/**
 * Listar historico (paginado)
 */
export async function getChats(userId: string, limit = 20, cursor?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('agent_sessions')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) return []

  return (data || []).map((s) => ({
    id: s.id,
    createdAt: new Date(s.created_at),
    title: s.title || 'Nova Conversa',
    userId: s.user_id,
    agentType: s.agent_type,
    status: s.status,
    metadata: s.metadata,
  }))
}

/**
 * Carregar conversa com mensagens
 */
export async function getChatWithMessages(chatId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('*, agent_messages(*)')
    .eq('id', chatId)
    .single()

  if (error || !data) return null

  const messages = (data.agent_messages || [])
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m: any) => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.created_at),
    }))

  return {
    chat: {
      id: data.id,
      createdAt: new Date(data.created_at),
      title: data.title || 'Nova Conversa',
      userId: data.user_id,
      agentType: data.agent_type,
      metadata: data.metadata,
    },
    messages,
  }
}

/**
 * Criar sessao e salvar mensagens (Usados pelo endpoint /api/chat)
 */
export async function createSession(userId: string, title = 'Nova Conversa', agentType = 'qa') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({ user_id: userId, title, agent_type: agentType, status: 'active' })
    .select()
    .single()
  return error ? null : data
}

export async function saveMessage(sessionId: string, role: string, content: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({ session_id: sessionId, role, content })
    .select()
    .single()

  if (!error) {
    await supabase.from('agent_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
  }
  return data
}

export async function deleteChat(chatId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('agent_sessions')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId)
  return !error
}

export async function updateChatTitle(chatId: string, title: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('agent_sessions')
    .update({ title })
    .eq('id', chatId)
  return !error
}
