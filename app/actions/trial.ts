"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_TRIAL_DAYS,
  calculateTrialEndDate,
  getTrialDurationFromDates,
  isTrialActive,
  isTrialExpired,
  normalizeTrialDays,
} from "@/lib/trial"

type StartTrialOptions = {
  shouldRevalidate?: boolean
  days?: number
}

export async function startTrial(options?: StartTrialOptions) {
  const shouldRevalidate = options?.shouldRevalidate ?? true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se já usou o trial e buscar pipeline_stage atual
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_used, trial_started_at, plan_type, trial_ends_at, pipeline_stage")
    .eq("id", user.id)
    .single()

  // Se já tem plano pago, não inicia trial
  if (profile?.plan_type && profile.plan_type !== "free") {
    return { success: false, message: "Usuário já possui plano pago" }
  }

  // Se já existe um trial iniciado (ativo ou expirado), não permite novo trial
  // Isso garante que cada usuário só pode ter um trial na vida
  if (profile?.trial_started_at) {
    if (profile.trial_ends_at && !isTrialExpired(profile.trial_ends_at)) {
      return { success: false, message: "Trial já está ativo" }
    }
    return { success: false, message: "Trial já foi utilizado" }
  }

  // Se trial_used está marcado como true, também bloqueia (para casos especiais)
  if (profile?.trial_used) {
    return { success: false, message: "Trial já foi utilizado" }
  }

  const metadataDays = typeof user.user_metadata?.trial_days === "number"
    ? user.user_metadata.trial_days
    : undefined

  const trialDays = normalizeTrialDays(options?.days ?? metadataDays ?? DEFAULT_TRIAL_DAYS)
  const startDate = new Date()
  const endDate = calculateTrialEndDate(startDate, trialDays)

  const { error } = await supabase
    .from("profiles")
    .update({
      trial_started_at: startDate.toISOString(),
      trial_ends_at: endDate.toISOString(),
      trial_used: false, // Mantém false - será marcado como true quando o trial expirar ou for consumido
      // Preserva o pipeline_stage se já existir, caso contrário define como 'novo_usuario'
      pipeline_stage: profile?.pipeline_stage || "novo_usuario",
    })
    .eq("id", user.id)

  if (error) {
    console.error("Erro ao iniciar trial:", error)
    return { success: false, message: "Erro ao iniciar trial" }
  }

  if (shouldRevalidate) {
    revalidatePath("/dashboard")
  }
  return { success: true, days: trialDays }
}

export async function getTrialStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { 
      isActive: false, 
      isExpired: false, 
      daysRemaining: 0,
      hasUsedTrial: false
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_started_at, trial_ends_at, trial_used, plan_type")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return { 
      isActive: false, 
      isExpired: false, 
      daysRemaining: 0,
      hasUsedTrial: false
    }
  }

  const hasActivePlan = profile.plan_type && profile.plan_type !== "free"
  
  // Se tem plano pago, o trial não é relevante (consideramos como não ativo/expirado para fins de bloqueio, mas o acesso é garantido pelo plano)
  if (hasActivePlan) {
    return {
      isActive: false,
      isExpired: false,
      daysRemaining: 0,
      hasUsedTrial: profile.trial_used || false
    }
  }

  return {
    isActive: isTrialActive(profile.trial_ends_at),
    isExpired: isTrialExpired(profile.trial_ends_at),
    trialDurationDays: getTrialDurationFromDates(
      profile.trial_started_at,
      profile.trial_ends_at,
      DEFAULT_TRIAL_DAYS
    ),
    trialEndsAt: profile.trial_ends_at,
    hasUsedTrial: profile.trial_used || false
  }
}
