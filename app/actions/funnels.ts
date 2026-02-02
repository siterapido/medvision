"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  FunnelConfiguration,
  FunnelCardData,
  FunnelMetrics,
  FunnelType
} from "@/lib/types/funnel"

/**
 * Get all active funnel configurations
 */
export async function getFunnels(): Promise<{
  success: boolean
  data: FunnelConfiguration[]
  message?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  // Verify user is admin or vendedor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "vendedor"].includes(profile.role)) {
    return { success: false, data: [], message: "Acesso negado" }
  }

  const { data: funnels, error } = await supabase
    .from("funnel_configurations")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching funnels:", error)
    return { success: false, data: [], message: "Erro ao buscar funis" }
  }

  return { success: true, data: funnels || [] }
}

/**
 * Get a single funnel configuration by slug
 */
export async function getFunnelBySlug(slug: string): Promise<{
  success: boolean
  data: FunnelConfiguration | null
  message?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: null, message: "Usuário não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "vendedor"].includes(profile.role)) {
    return { success: false, data: null, message: "Acesso negado" }
  }

  const { data: funnel, error } = await supabase
    .from("funnel_configurations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching funnel:", error)
    return { success: false, data: null, message: "Funil não encontrado" }
  }

  return { success: true, data: funnel }
}

/**
 * Get metrics for all funnels (for dashboard cards)
 */
export async function getFunnelMetrics(): Promise<{
  success: boolean
  data: FunnelCardData[]
  message?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "vendedor"].includes(profile.role)) {
    return { success: false, data: [], message: "Acesso negado" }
  }

  // Fetch all active funnels
  const { data: funnels, error: funnelsError } = await supabase
    .from("funnel_configurations")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })

  if (funnelsError) {
    console.error("Error fetching funnels:", funnelsError)
    return { success: false, data: [], message: "Erro ao buscar funis" }
  }

  if (!funnels || funnels.length === 0) {
    return { success: true, data: [] }
  }

  // Calculate metrics for each funnel
  const metricsPromises = funnels.map(async (funnel): Promise<FunnelCardData> => {
    const stages = funnel.stages as Array<{ id: string; title: string }>
    const convertedStageId = stages.find(s =>
      s.id === "convertido" || s.title.toLowerCase().includes("convertido")
    )?.id || "convertido"

    // Determine urgent stages based on funnel type
    const urgentStageIds = funnel.funnel_type === "trial"
      ? ["barreira_plano", "risco_churn", "perdido"]
      : ["descartado"]

    let totalLeads = 0
    let convertedLeads = 0
    let urgentCount = 0

    if (funnel.source_table === "leads") {
      // Query leads table
      const { count: total } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", funnel.id)

      const { count: converted } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", funnel.id)
        .eq("status", convertedStageId)

      // Also count leads without funnel_id (for backward compatibility)
      if (funnel.is_default && funnel.funnel_type === "cold_prospecting") {
        const { count: totalNoFunnel } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .is("funnel_id", null)

        const { count: convertedNoFunnel } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .is("funnel_id", null)
          .eq("status", "convertido")

        totalLeads = (total || 0) + (totalNoFunnel || 0)
        convertedLeads = (converted || 0) + (convertedNoFunnel || 0)
      } else {
        totalLeads = total || 0
        convertedLeads = converted || 0
      }

      // Count urgent (discarded)
      const { count: discarded } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", funnel.id)
        .eq("status", "descartado")

      urgentCount = discarded || 0

    } else {
      // Query profiles table (for trial funnels)
      const baseQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .neq("role", "admin")
        .neq("role", "vendedor")
        .is("deleted_at", null)

      // For trial funnel, include users with trial_started_at
      if (funnel.funnel_type === "trial") {
        const { count: total } = await baseQuery
          .not("trial_started_at", "is", null)

        const { count: converted } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .neq("role", "admin")
          .neq("role", "vendedor")
          .is("deleted_at", null)
          .or("pipeline_stage.eq.convertido,subscription_status.in.(active,trialing)")

        // Count users at risk (trial ending soon or inactive)
        const now = new Date()
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

        const { count: atRisk } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .neq("role", "admin")
          .neq("role", "vendedor")
          .is("deleted_at", null)
          .not("trial_started_at", "is", null)
          .or(`pipeline_stage.in.(barreira_plano,risco_churn),last_active_at.lt.${threeDaysAgo.toISOString()}`)

        totalLeads = total || 0
        convertedLeads = converted || 0
        urgentCount = atRisk || 0
      } else {
        // For event funnels
        const { count: total } = await baseQuery
          .eq("funnel_id", funnel.id)

        const { count: converted } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("funnel_id", funnel.id)
          .eq("pipeline_stage", "convertido")

        totalLeads = total || 0
        convertedLeads = converted || 0
      }
    }

    const conversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 100)
      : 0

    return {
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      description: funnel.description,
      funnel_type: funnel.funnel_type as FunnelType,
      trial_duration_days: funnel.trial_duration_days,
      available_views: funnel.available_views,
      source_table: funnel.source_table,
      is_active: funnel.is_active,
      is_default: funnel.is_default,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: conversionRate,
      urgent_count: urgentCount
    }
  })

  const metrics = await Promise.all(metricsPromises)

  return { success: true, data: metrics }
}

/**
 * Get funnel metrics for a specific funnel
 */
export async function getSingleFunnelMetrics(funnelId: string): Promise<{
  success: boolean
  data: FunnelMetrics | null
  message?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: null, message: "Usuário não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "vendedor"].includes(profile.role)) {
    return { success: false, data: null, message: "Acesso negado" }
  }

  const { data: funnel, error } = await supabase
    .from("funnel_configurations")
    .select("*")
    .eq("id", funnelId)
    .single()

  if (error || !funnel) {
    return { success: false, data: null, message: "Funil não encontrado" }
  }

  const stages = funnel.stages as Array<{ id: string }>
  const stageCounts: Record<string, number> = {}
  let totalLeads = 0
  let convertedLeads = 0
  let last7DaysNew = 0
  let last7DaysConverted = 0

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  if (funnel.source_table === "leads") {
    // Get counts for each stage
    for (const stage of stages) {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funnel_id", funnelId)
        .eq("status", stage.id)

      stageCounts[stage.id] = count || 0
      totalLeads += count || 0

      if (stage.id === "convertido") {
        convertedLeads = count || 0
      }
    }

    // Last 7 days metrics
    const { count: newLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("funnel_id", funnelId)
      .gte("created_at", sevenDaysAgo.toISOString())

    const { count: convertedRecent } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("funnel_id", funnelId)
      .eq("status", "convertido")
      .gte("converted_at", sevenDaysAgo.toISOString())

    last7DaysNew = newLeads || 0
    last7DaysConverted = convertedRecent || 0

  } else {
    // Profiles table (trial funnels)
    for (const stage of stages) {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .neq("role", "admin")
        .neq("role", "vendedor")
        .is("deleted_at", null)
        .eq("pipeline_stage", stage.id)

      stageCounts[stage.id] = count || 0
      totalLeads += count || 0

      if (stage.id === "convertido") {
        convertedLeads = count || 0
      }
    }

    // Last 7 days metrics
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .gte("created_at", sevenDaysAgo.toISOString())

    last7DaysNew = newUsers || 0
  }

  const conversionRate = totalLeads > 0
    ? Math.round((convertedLeads / totalLeads) * 100)
    : 0

  return {
    success: true,
    data: {
      funnel_id: funnel.id,
      funnel_name: funnel.name,
      funnel_slug: funnel.slug,
      funnel_type: funnel.funnel_type as FunnelType,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: conversionRate,
      stage_counts: stageCounts,
      last_7_days_new: last7DaysNew,
      last_7_days_converted: last7DaysConverted
    }
  }
}
