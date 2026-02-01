"use server"

import { createClient } from "@/lib/supabase/server"
import { LEAD_STAGES, PROFILE_STAGES, type FunnelMetrics, type LeadStageId, type ProfileStageId } from "@/lib/funnel-stages"

/**
 * Busca métricas consolidadas do funil completo
 */
export async function getFunnelMetrics(): Promise<{ success: boolean; data?: FunnelMetrics; message?: string }> {
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
    return { success: false, message: "Apenas administradores podem visualizar métricas do funil" }
  }

  // Buscar contagens de leads por status
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("status")

  if (leadsError) {
    console.error("Erro ao buscar leads:", leadsError)
    return { success: false, message: "Erro ao buscar métricas de leads" }
  }

  // Buscar contagens de profiles por pipeline_stage
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("pipeline_stage, plan_type")
    .is("deleted_at", null)
    .neq("role", "admin")
    .neq("role", "vendedor")

  if (profilesError) {
    console.error("Erro ao buscar profiles:", profilesError)
    return { success: false, message: "Erro ao buscar métricas de profiles" }
  }

  // Calcular métricas de prospecção
  const leadsByStage: Record<string, number> = {}
  LEAD_STAGES.forEach(stage => { leadsByStage[stage.id] = 0 })

  leads?.forEach(lead => {
    if (leadsByStage[lead.status] !== undefined) {
      leadsByStage[lead.status]++
    }
  })

  const totalLeads = leads?.length || 0
  const convertedLeads = leadsByStage["convertido"] || 0
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

  // Calcular métricas de trial
  const profilesByStage: Record<string, number> = {}
  PROFILE_STAGES.forEach(stage => { profilesByStage[stage.id] = 0 })

  let paidProfiles = 0
  profiles?.forEach(p => {
    if (p.pipeline_stage && profilesByStage[p.pipeline_stage] !== undefined) {
      profilesByStage[p.pipeline_stage]++
    }
    if (p.plan_type === "pro" || p.pipeline_stage === "convertido") {
      paidProfiles++
    }
  })

  const totalProfiles = profiles?.length || 0
  const trialConversionRate = totalProfiles > 0 ? (paidProfiles / totalProfiles) * 100 : 0

  // Calcular métricas globais
  const overallLeadToPaid = totalLeads > 0 ? (paidProfiles / totalLeads) * 100 : 0

  const metrics: FunnelMetrics = {
    prospecting: {
      total: totalLeads,
      byStage: leadsByStage as Record<LeadStageId, number>,
      conversionRate: Math.round(leadConversionRate * 10) / 10,
    },
    trial: {
      total: totalProfiles,
      byStage: profilesByStage as Record<ProfileStageId, number>,
      conversionRate: Math.round(trialConversionRate * 10) / 10,
    },
    overall: {
      totalLeads,
      totalTrials: totalProfiles,
      totalPaid: paidProfiles,
      leadToTrialRate: Math.round(leadConversionRate * 10) / 10,
      trialToPaidRate: Math.round(trialConversionRate * 10) / 10,
      leadToPaidRate: Math.round(overallLeadToPaid * 10) / 10,
    },
  }

  return { success: true, data: metrics }
}

export type CustomerJourneyEvent = {
  id: string
  type: "lead_created" | "lead_stage_change" | "lead_note" | "lead_converted" | "profile_created" | "profile_stage_change" | "profile_note" | "payment" | "profile_converted"
  date: string
  stage?: string
  description: string
  metadata?: Record<string, any>
}

export type CustomerJourney = {
  lead?: {
    id: string
    name?: string | null
    phone: string
    email?: string | null
    status: string
    source?: string | null
    created_at: string
    converted_at?: string | null
  }
  profile?: {
    id: string
    name?: string | null
    email?: string | null
    pipeline_stage?: string | null
    plan_type?: string | null
    created_at: string
    trial_ends_at?: string | null
  }
  events: CustomerJourneyEvent[]
  isLinked: boolean
}

/**
 * Busca a jornada completa de um cliente (cold lead → trial → pro)
 * Aceita tanto lead_id quanto profile_id
 */
export async function getCustomerJourney(params: { leadId?: string; profileId?: string }): Promise<{ success: boolean; data?: CustomerJourney; message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar role
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!adminProfile || (adminProfile.role !== "admin" && adminProfile.role !== "vendedor")) {
    return { success: false, message: "Acesso negado" }
  }

  let lead = null
  let profile = null
  const events: CustomerJourneyEvent[] = []

  // Se temos leadId, buscar o lead
  if (params.leadId) {
    const { data: leadData } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.leadId)
      .single()

    lead = leadData

    // Se o lead foi convertido, buscar o profile
    if (leadData?.converted_to_user_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, pipeline_stage, plan_type, created_at, trial_ends_at")
        .eq("id", leadData.converted_to_user_id)
        .single()
      profile = profileData
    }
  }

  // Se temos profileId (e não achamos por lead), buscar o profile diretamente
  if (params.profileId && !profile) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, name, email, pipeline_stage, plan_type, created_at, trial_ends_at")
      .eq("id", params.profileId)
      .single()
    profile = profileData

    // Tentar encontrar o lead de origem
    if (profileData) {
      const { data: leadData } = await supabase
        .from("leads")
        .select("*")
        .eq("converted_to_user_id", params.profileId)
        .maybeSingle()
      lead = leadData
    }
  }

  // Construir timeline de eventos

  // Eventos do lead
  if (lead) {
    events.push({
      id: `lead_created_${lead.id}`,
      type: "lead_created",
      date: lead.created_at,
      description: "Lead importado",
      metadata: { source: lead.source, sheet: lead.sheet_source_name },
    })

    // Buscar notas do lead
    const { data: leadNotes } = await supabase
      .from("lead_notes")
      .select(`*, creator:profiles!lead_notes_created_by_fkey(name)`)
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true })

    leadNotes?.forEach((note: any) => {
      events.push({
        id: `lead_note_${note.id}`,
        type: "lead_note",
        date: note.created_at,
        description: "Nota adicionada",
        metadata: { note: note.note, creator: note.creator?.name },
      })
    })

    if (lead.converted_at) {
      events.push({
        id: `lead_converted_${lead.id}`,
        type: "lead_converted",
        date: lead.converted_at,
        stage: "convertido",
        description: "Lead convertido para trial",
      })
    }
  }

  // Eventos do profile
  if (profile) {
    events.push({
      id: `profile_created_${profile.id}`,
      type: "profile_created",
      date: profile.created_at,
      stage: "cadastro",
      description: "Conta criada no trial",
    })

    // Buscar notas do profile
    const { data: profileNotes } = await supabase
      .from("pipeline_notes")
      .select(`*, creator:profiles!pipeline_notes_created_by_fkey(name)`)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true })

    profileNotes?.forEach((note: any) => {
      events.push({
        id: `profile_note_${note.id}`,
        type: "profile_note",
        date: note.created_at,
        description: "Nota adicionada",
        metadata: { note: note.note, creator: note.creator?.name },
      })
    })

    // Buscar pagamentos
    const { data: payments } = await supabase
      .from("payment_history")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true })

    payments?.forEach((payment: any) => {
      events.push({
        id: `payment_${payment.id}`,
        type: "payment",
        date: payment.created_at,
        description: `Pagamento ${payment.status}`,
        metadata: { amount: payment.amount, currency: payment.currency },
      })

      if (payment.status === "completed" || payment.status === "approved") {
        events.push({
          id: `profile_converted_${profile.id}`,
          type: "profile_converted",
          date: payment.created_at,
          stage: "convertido",
          description: "Convertido para Pro",
        })
      }
    })
  }

  // Ordenar eventos por data
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    success: true,
    data: {
      lead: lead ? {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        created_at: lead.created_at,
        converted_at: lead.converted_at,
      } : undefined,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        pipeline_stage: profile.pipeline_stage,
        plan_type: profile.plan_type,
        created_at: profile.created_at,
        trial_ends_at: profile.trial_ends_at,
      } : undefined,
      events,
      isLinked: !!(lead && profile),
    },
  }
}

/**
 * Busca vendedores para atribuição
 */
export async function getSellers() {
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
    return { success: false, data: [], message: "Acesso negado" }
  }

  // Buscar vendedores (role = 'vendedor' ou 'admin')
  const { data: sellers, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("role", ["vendedor", "admin"])
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar vendedores:", error)
    return { success: false, data: [], message: "Erro ao buscar vendedores" }
  }

  return { success: true, data: sellers || [] }
}
