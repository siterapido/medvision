/**
 * Serviço de gerenciamento de conversas WhatsApp
 *
 * Funções para criar, vincular e gerenciar conversas do WhatsApp
 * com suporte a memória de contexto e vinculação com profiles.
 */

import { createAdminClient } from "@/lib/supabase/admin"

type AnyRecord = Record<string, unknown>

// Helper to bypass Supabase strict typing for untyped tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTable(supabase: ReturnType<typeof createAdminClient>, table: string): any {
  // Using type assertion to work with untyped Supabase tables
  return (supabase as any).from(table)
}

export interface WhatsAppConversation {
  id: string
  phone: string
  user_id: string | null
  name: string | null
  last_message_at: string
  metadata: AnyRecord
  created_at: string
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  message_type: string
  metadata: AnyRecord
  created_at: string
}

export interface ProfileContext {
  id: string
  name: string | null
  email: string | null
  plan_type: string | null
  trial_ends_at: string | null
  pipeline_stage: string | null
}

export interface ConversationContext {
  conversation: WhatsAppConversation
  profile: ProfileContext | null
  messages: WhatsAppMessage[]
}

/**
 * Normaliza número de telefone para formato padrão
 * Remove caracteres não numéricos e adiciona código do país se necessário
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  // Adiciona código do Brasil se não tiver código de país
  if (cleaned.length <= 11) {
    return `55${cleaned}`
  }
  return cleaned
}

/**
 * Obtém ou cria uma conversa para um número de telefone
 */
export async function getOrCreateConversation(
  phone: string,
  name?: string
): Promise<WhatsAppConversation> {
  const supabase = createAdminClient()
  const normalizedPhone = normalizePhone(phone)

  // Tentar buscar conversa existente
  const { data: existingData } = await getTable(supabase, "whatsapp_conversations")
    .select("*")
    .eq("phone", normalizedPhone)
    .single()

  const existing = existingData as WhatsAppConversation | null

  if (existing) {
    // Atualizar last_message_at e nome se fornecido
    const updates: { last_message_at: string; name?: string } = {
      last_message_at: new Date().toISOString(),
    }
    if (name && !existing.name) {
      updates.name = name
    }

    await getTable(supabase, "whatsapp_conversations")
      .update(updates)
      .eq("id", existing.id)

    return { ...existing, ...updates }
  }

  // Criar nova conversa
  const { data: created, error } = await getTable(supabase, "whatsapp_conversations")
    .insert({
      phone: normalizedPhone,
      name: name || null,
      metadata: {},
    })
    .select()
    .single()

  if (error) {
    console.error("[ConversationService] Error creating conversation:", error)
    throw new Error("Failed to create conversation")
  }

  return created as WhatsAppConversation
}

/**
 * Busca o profile vinculado a um telefone
 */
export async function getProfileByPhone(
  phone: string
): Promise<ProfileContext | null> {
  const supabase = createAdminClient()
  const normalizedPhone = normalizePhone(phone)

  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, plan_type, trial_ends_at, pipeline_stage")
    .eq("whatsapp", normalizedPhone)
    .single()

  return data as ProfileContext | null
}

/**
 * Vincula uma conversa a um profile
 */
export async function linkConversationToProfile(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient()

  await getTable(supabase, "whatsapp_conversations")
    .update({ user_id: userId })
    .eq("id", conversationId)
}

/**
 * Salva uma mensagem na conversa
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: AnyRecord
): Promise<WhatsAppMessage> {
  const supabase = createAdminClient()

  const messageType = metadata?.original_type || "text"

  const { data, error } = await getTable(supabase, "whatsapp_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      message_type: messageType,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error) {
    console.error("[ConversationService] Error saving message:", error)
    throw new Error("Failed to save message")
  }

  // Atualizar last_message_at da conversa
  await getTable(supabase, "whatsapp_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)

  return data as WhatsAppMessage
}

/**
 * Obtém as mensagens recentes de uma conversa
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 10
): Promise<WhatsAppMessage[]> {
  const supabase = createAdminClient()

  const { data, error } = await getTable(supabase, "whatsapp_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[ConversationService] Error fetching messages:", error)
    return []
  }

  // Retornar em ordem cronológica (mais antigas primeiro)
  return (data as WhatsAppMessage[]).reverse()
}

/**
 * Obtém contexto completo de uma conversa
 * Inclui: conversa, profile vinculado (se houver), e mensagens recentes
 *
 * NOTA: Profile linking é feito automaticamente pelo trigger do banco
 * (trigger_link_whatsapp_profile) - não precisamos fazer manualmente aqui
 */
export async function getConversationContext(
  phone: string,
  senderName?: string
): Promise<ConversationContext> {
  const conversation = await getOrCreateConversation(phone, senderName)

  // Profile já está vinculado pelo trigger do banco
  // Só buscamos se user_id existir
  const profile = conversation.user_id
    ? await getProfileById(conversation.user_id)
    : null

  const messages = await getRecentMessages(conversation.id, 10)

  return { conversation, profile, messages }
}

/**
 * Busca profile por ID
 */
async function getProfileById(userId: string): Promise<ProfileContext | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, plan_type, trial_ends_at, pipeline_stage")
    .eq("id", userId)
    .single()

  return data as ProfileContext | null
}

/**
 * Calcula dias restantes de trial
 */
export function calcTrialDays(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null

  const trialEnd = new Date(trialEndsAt)
  const now = new Date()
  const diffMs = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * Formata histórico de mensagens para o formato esperado pelo AI agent
 */
export function formatMessagesForAgent(
  messages: WhatsAppMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
}
