import { createClient } from "@/lib/supabase/server"

const CHAT_RETENTION_DAYS = 30

const SCHEMA_CACHE_ERROR_MESSAGE = 
  "A tabela de conversas ainda não está disponível. Isso geralmente acontece após aplicar migrações. " +
  "O cache do PostgREST pode levar alguns minutos para atualizar. " +
  "Tente novamente em alguns instantes ou atualize o schema cache no Supabase Dashboard."

function getRetentionCutoffIso() {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - CHAT_RETENTION_DAYS)
  return cutoff.toISOString()
}

/**
 * Detecta se um erro é relacionado ao cache do schema do PostgREST
 */
function isSchemaCacheError(error: any): boolean {
  const errorCode = error?.code || ""
  const reason = error?.message || ""
  const errorDetails = error?.details || ""
  
  return (
    errorCode === "42P01" ||
    errorCode === "PGRST301" ||
    reason.toLowerCase().includes("chat_threads") ||
    reason.toLowerCase().includes("schema cache") ||
    reason.toLowerCase().includes("could not find the table") ||
    errorDetails?.toLowerCase().includes("schema cache")
  )
}

export type ChatThread = {
  id: string
  user_id: string
  title: string | null
  plan: string | null
  metadata: Record<string, unknown>
  last_message_at: string
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: number
  thread_id: string | null
  user_id: string
  role: "user" | "assistant"
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * Lista todas as threads de chat do usuário autenticado
 */
export async function listThreads(userId: string): Promise<ChatThread[]> {
  const supabase = await createClient()
  const retentionCutoff = getRetentionCutoffIso()
  
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .gte("last_message_at", retentionCutoff)
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("[chat] Erro ao listar threads:", error)
    if (isSchemaCacheError(error)) {
      throw new Error(SCHEMA_CACHE_ERROR_MESSAGE)
    }
    throw new Error("Falha ao carregar conversas")
  }

  return (data || []) as ChatThread[]
}

/**
 * Cria uma nova thread de chat
 */
export async function createThread(
  userId: string,
  firstUserMessage?: string,
  plan?: string
): Promise<ChatThread> {
  const supabase = await createClient()

  const title = firstUserMessage
    ? firstUserMessage.trim().slice(0, 100)
    : null

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: userId,
      title,
      plan: plan || null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[chat] Erro ao criar thread:", error)
    if (isSchemaCacheError(error)) {
      throw new Error(SCHEMA_CACHE_ERROR_MESSAGE)
    }
    const reason = error?.message || "Falha ao criar conversa"
    throw new Error(reason)
  }

  return data as ChatThread
}

/**
 * Busca uma thread específica com validação de propriedade
 */
export async function getThread(
  threadId: string,
  userId: string
): Promise<ChatThread | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null
    }
    console.error("[chat] Erro ao buscar thread:", error)
    if (isSchemaCacheError(error)) {
      throw new Error(SCHEMA_CACHE_ERROR_MESSAGE)
    }
    throw new Error("Falha ao carregar conversa")
  }

  return data as ChatThread
}

/**
 * Busca todas as mensagens de uma thread
 */
export async function getMessages(
  threadId: string,
  userId: string,
  limit?: number
): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const retentionCutoff = getRetentionCutoffIso()

  // Verificar se a thread pertence ao usuário
  const thread = await getThread(threadId, userId)
  if (!thread) {
    throw new Error("Conversa não encontrada")
  }

  let query = supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .gte("created_at", retentionCutoff)
    .order("created_at", { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("[chat] Erro ao buscar mensagens:", error)
    throw new Error("Falha ao carregar mensagens")
  }

  return (data || []) as ChatMessage[]
}

/**
 * Adiciona uma mensagem a uma thread
 */
export async function appendMessage(
  threadId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>
): Promise<ChatMessage> {
  const supabase = await createClient()

  // Verificar se a thread pertence ao usuário
  const thread = await getThread(threadId, userId)
  if (!thread) {
    throw new Error("Conversa não encontrada")
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      user_id: userId,
      role,
      content: content.trim(),
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error || !data) {
    console.error("[chat] Erro ao adicionar mensagem:", error)
    throw new Error("Falha ao salvar mensagem")
  }

  return data as ChatMessage
}

/**
 * Atualiza o título de uma thread
 */
export async function updateThreadTitle(
  threadId: string,
  userId: string,
  title: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("chat_threads")
    .update({ title: title.trim().slice(0, 100) })
    .eq("id", threadId)
    .eq("user_id", userId)

  if (error) {
    console.error("[chat] Erro ao atualizar título:", error)
    if (isSchemaCacheError(error)) {
      throw new Error(SCHEMA_CACHE_ERROR_MESSAGE)
    }
    throw new Error("Falha ao atualizar título")
  }
}

/**
 * Deleta uma thread e todas as suas mensagens (cascade)
 */
export async function deleteThread(
  threadId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", userId)

  if (error) {
    console.error("[chat] Erro ao deletar thread:", error)
    if (isSchemaCacheError(error)) {
      throw new Error(SCHEMA_CACHE_ERROR_MESSAGE)
    }
    throw new Error("Falha ao deletar conversa")
  }
}

