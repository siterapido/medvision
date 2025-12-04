"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type PipelineStage =
  | "novo_lead"
  | "trial_ativo"
  | "urgente"
  | "contato_realizado"
  | "proposta_enviada"
  | "convertido"
  | "perdido"

export async function updatePipelineStage(userId: string, stage: PipelineStage | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem atualizar etapas do pipeline" }
  }

  // Validar stage
  if (stage && !["novo_lead", "trial_ativo", "urgente", "contato_realizado", "proposta_enviada", "convertido", "perdido"].includes(stage)) {
    return { success: false, message: "Etapa inválida" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ pipeline_stage: stage })
    .eq("id", userId)

  if (error) {
    console.error("Erro ao atualizar etapa do pipeline:", error)
    return { success: false, message: "Erro ao atualizar etapa do pipeline" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

export async function addPipelineNote(userId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem adicionar notas" }
  }

  if (!note || note.trim().length === 0) {
    return { success: false, message: "A nota não pode estar vazia" }
  }

  const { error } = await supabase
    .from("pipeline_notes")
    .insert({
      user_id: userId,
      note: note.trim(),
      created_by: user.id,
    })

  if (error) {
    console.error("Erro ao adicionar nota ao pipeline:", error)
    return { success: false, message: "Erro ao adicionar nota" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

export async function getPipelineNotes(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, data: [], message: "Apenas administradores podem visualizar notas" }
  }

  const { data: notes, error } = await supabase
    .from("pipeline_notes")
    .select(
      `
      id,
      note,
      created_at,
      created_by
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar notas do pipeline:", error)
    return { success: false, data: [], message: "Erro ao buscar notas" }
  }

  if (!notes || notes.length === 0) {
    return { success: true, data: [] }
  }

  // Buscar perfis dos criadores das notas
  const creatorIds = [...new Set(notes.map((note) => note.created_by))]
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", creatorIds)

  // Adicionar informações do criador a cada nota
  const notesWithCreators = notes.map((note) => ({
    ...note,
    profiles: creators?.find((creator) => creator.id === note.created_by) || null,
  }))

  return { success: true, data: notesWithCreators || [] }
}

export async function deletePipelineNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin e é o autor da nota
  const { data: note } = await supabase
    .from("pipeline_notes")
    .select("created_by")
    .eq("id", noteId)
    .single()

  if (!note) {
    return { success: false, message: "Nota não encontrada" }
  }

  if (note.created_by !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return { success: false, message: "Apenas o autor da nota pode excluí-la" }
    }
  }

  const { error } = await supabase
    .from("pipeline_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("Erro ao excluir nota do pipeline:", error)
    return { success: false, message: "Erro ao excluir nota" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

