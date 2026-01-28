"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/**
 * Funil comportamental Trial → Pro
 * Baseado em ações reais do usuário
 */
type PipelineStage =
  | "cadastro"           // 📥 Cadastro Realizado
  | "primeira_consulta"  // 🧪 Primeira Consulta
  | "usou_vision"        // 🧠 Usou Odonto Vision
  | "uso_recorrente"     // 🔄 Uso Recorrente (3+ consultas)
  | "barreira_plano"     // 🚧 Barreira do Plano (limite atingido)
  | "convertido"         // 💳 Convertido (pagamento confirmado)
  | "risco_churn"        // 👻 Risco de Churn (inativo 3+ dias)
  | "perdido"            // ❌ Perdido (trial expirado sem conversão)

const VALID_STAGES: PipelineStage[] = [
  "cadastro",
  "primeira_consulta",
  "usou_vision",
  "uso_recorrente",
  "barreira_plano",
  "convertido",
  "risco_churn",
  "perdido"
]

export async function updatePipelineStage(userId: string, stage: PipelineStage | string | null) {
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

  // Validar stage - aceita tanto novos quanto antigos (para compatibilidade)
  if (stage && !VALID_STAGES.includes(stage as PipelineStage)) {
    // Mapear stages antigos para novos
    const legacyMap: Record<string, PipelineStage> = {
      "novo_usuario": "cadastro",
      "situacao": "primeira_consulta",
      "problema": "primeira_consulta",
      "implicacao": "uso_recorrente",
      "motivacao": "barreira_plano",
      "nao_convertido": "perdido"
    }

    if (legacyMap[stage]) {
      stage = legacyMap[stage]
    } else {
      return { success: false, message: "Etapa inválida" }
    }
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

export async function createFollowup(userId: string, scheduledFor: Date, note: string) {
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
    return { success: false, message: "Apenas administradores podem criar follow-ups" }
  }

  if (!note || note.trim().length === 0) {
    return { success: false, message: "A nota não pode estar vazia" }
  }

  const { error } = await supabase
    .from("pipeline_followups")
    .insert({
      user_id: userId,
      scheduled_for: scheduledFor.toISOString(),
      note: note.trim(),
      created_by: user.id,
    })

  if (error) {
    console.error("Erro ao criar follow-up:", error)
    return { success: false, message: "Erro ao criar follow-up" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

export async function getFollowups(userId: string) {
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
    return { success: false, data: [], message: "Apenas administradores podem ver follow-ups" }
  }

  const { data: followups, error } = await supabase
    .from("pipeline_followups")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: true })

  if (error) {
    console.error("Erro ao buscar follow-ups:", error)
    return { success: false, data: [], message: "Erro ao buscar follow-ups" }
  }

  return { success: true, data: followups || [] }
}

export async function completeFollowup(followupId: string, completed: boolean) {
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
    return { success: false, message: "Apenas administradores podem atualizar follow-ups" }
  }

  const { error } = await supabase
    .from("pipeline_followups")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", followupId)

  if (error) {
    console.error("Erro ao atualizar follow-up:", error)
    return { success: false, message: "Erro ao atualizar follow-up" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

export async function deleteFollowup(followupId: string) {
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
    return { success: false, message: "Apenas administradores podem excluir follow-ups" }
  }

  const { error } = await supabase
    .from("pipeline_followups")
    .delete()
    .eq("id", followupId)

  if (error) {
    console.error("Erro ao excluir follow-up:", error)
    return { success: false, message: "Erro ao excluir follow-up" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

export async function deleteLead(userId: string) {
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
    return { success: false, message: "Apenas administradores podem excluir leads" }
  }

  // Verificar se o lead existe e não é um admin
  const { data: leadProfile } = await supabase
    .from("profiles")
    .select("role, deleted_at")
    .eq("id", userId)
    .single()

  if (!leadProfile) {
    return { success: false, message: "Lead não encontrado" }
  }

  if (leadProfile.role === "admin") {
    return { success: false, message: "Não é possível excluir um administrador pelo pipeline" }
  }

  if (leadProfile.deleted_at) {
    return { success: false, message: "Este lead já está na lixeira" }
  }

  // Soft delete: marcar como deletado ao invés de remover permanentemente
  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq("id", userId)

  if (error) {
    console.error("Erro ao mover lead para lixeira:", error)
    return { success: false, message: "Erro ao mover lead para lixeira" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true, message: "Lead movido para lixeira com sucesso" }
}

export async function restoreLead(userId: string) {
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
    return { success: false, message: "Apenas administradores podem restaurar leads" }
  }

  // Restaurar o lead
  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq("id", userId)

  if (error) {
    console.error("Erro ao restaurar lead:", error)
    return { success: false, message: "Erro ao restaurar lead" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true, message: "Lead restaurado com sucesso" }
}

export async function getLeadDetails(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminProfile?.role !== "admin") {
    return { success: false, message: "Acesso negado" }
  }

  // Buscar dados do perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (profileError) {
    console.error("Erro ao buscar perfil:", profileError)
    return { success: false, message: "Erro ao buscar perfil" }
  }

  // Buscar histórico de pagamentos
  const { data: payments } = await supabase
    .from("payment_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Buscar cursos em andamento
  const { data: courses } = await supabase
    .from("user_courses")
    .select(`
      *,
      course:courses(title, thumbnail)
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  // Buscar notas
  const { data: notes } = await supabase
    .from("pipeline_notes")
    .select(`
      *,
      creator:profiles!pipeline_notes_created_by_fkey(name, email)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Buscar follow-ups
  const { data: followups } = await supabase
    .from("pipeline_followups")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: true })

  // Construir timeline básica
  const timeline = [
    // Evento de criação
    {
      id: "created",
      type: "created",
      date: profile.created_at,
      description: "Conta criada",
      metadata: { source: profile.account_source },
    },
    // Eventos de trial
    ...(profile.trial_started_at ? [{
      id: "trial_started",
      type: "trial_started",
      date: profile.trial_started_at,
      description: "Trial iniciado",
    }] : []),
    ...(profile.trial_ends_at ? [{
      id: "trial_ends",
      type: "trial_ends",
      date: profile.trial_ends_at,
      description: "Fim do trial previsto",
    }] : []),
    // Notas
    ...(notes || []).map((n: any) => ({
      id: n.id,
      type: "note",
      date: n.created_at,
      description: "Nota adicionada",
      metadata: { note: n.note, creator: n.creator?.name || n.creator?.email },
    })),
    // Follow-ups
    ...(followups || []).map((f: any) => ({
      id: f.id,
      type: "followup",
      date: f.scheduled_for,
      description: "Follow-up agendado",
      metadata: { note: f.note, completed: f.completed, completed_at: f.completed_at },
    })),
    // Pagamentos
    ...(payments || []).map((p: any) => ({
      id: p.id,
      type: "payment",
      date: p.created_at,
      description: `Pagamento ${p.status}`,
      metadata: { amount: p.amount, currency: p.currency },
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    success: true,
    data: {
      profile,
      payments: payments || [],
      courses: courses || [],
      timeline,
      stats: {
        total_courses: courses?.length || 0,
        completed_courses: courses?.filter((c: any) => c.progress === 100).length || 0,
        total_spent: payments?.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) || 0,
      }
    }
  }
}
