"use server"

import { revalidatePath } from "next/cache"
import {
  listThreads,
  createThread,
  getThread,
  getMessages,
  appendMessage,
  updateThreadTitle,
  deleteThread,
  type ChatThread,
  type ChatMessage,
} from "@/lib/chat"
import { createClient } from "@/lib/supabase/server"

/**
 * Server action: Lista threads do usuário autenticado
 */
export async function getChatThreads(): Promise<{
  success: boolean
  data?: ChatThread[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const threads = await listThreads(user.id)
    return { success: true, data: threads }
  } catch (error) {
    console.error("[chat actions] Erro ao listar threads:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Server action: Cria uma nova thread
 */
export async function createChatThread(
  firstMessage?: string,
  plan?: string
): Promise<{
  success: boolean
  data?: ChatThread
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[chat actions] Erro de autenticação:", authError)
      return { 
        success: false, 
        error: "Erro de autenticação. Por favor, faça login novamente." 
      }
    }

    if (!user) {
      console.error("[chat actions] Usuário não autenticado")
      return { success: false, error: "Usuário não autenticado" }
    }

    const thread = await createThread(user.id, firstMessage, plan)
    revalidatePath("/dashboard/chat")
    return { success: true, data: thread }
  } catch (error) {
    console.error("[chat actions] Erro ao criar thread:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Server action: Busca mensagens de uma thread
 */
export async function getChatMessages(
  threadId: string,
  limit?: number
): Promise<{
  success: boolean
  data?: ChatMessage[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const messages = await getMessages(threadId, user.id, limit)
    return { success: true, data: messages }
  } catch (error) {
    console.error("[chat actions] Erro ao buscar mensagens:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Server action: Adiciona mensagem a uma thread
 */
export async function addChatMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  data?: ChatMessage
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const message = await appendMessage(threadId, user.id, role, content, metadata)
    revalidatePath("/dashboard/chat")
    return { success: true, data: message }
  } catch (error) {
    console.error("[chat actions] Erro ao adicionar mensagem:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Server action: Atualiza título de uma thread
 */
export async function updateChatThreadTitle(
  threadId: string,
  title: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    await updateThreadTitle(threadId, user.id, title)
    revalidatePath("/dashboard/chat")
    return { success: true }
  } catch (error) {
    console.error("[chat actions] Erro ao atualizar título:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Server action: Deleta uma thread
 */
export async function removeChatThread(
  threadId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    await deleteThread(threadId, user.id)
    revalidatePath("/dashboard/chat")
    return { success: true }
  } catch (error) {
    console.error("[chat actions] Erro ao deletar thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

