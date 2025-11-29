"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateTrialEndDate, isTrialActive, isTrialExpired } from "@/lib/trial"
import { revalidatePath } from "next/cache"

export async function startTrial(shouldRevalidate = true) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se já usou o trial
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_used, trial_started_at, plan_type")
    .eq("id", user.id)
    .single()

  if (profile?.trial_used || profile?.trial_started_at) {
    return { success: false, message: "Trial já utilizado ou em andamento" }
  }

  // Se já tem plano pago, não inicia trial
  if (profile?.plan_type && profile.plan_type !== "free") {
    return { success: false, message: "Usuário já possui plano pago" }
  }

  const startDate = new Date()
  const endDate = calculateTrialEndDate(startDate)

  const { error } = await supabase
    .from("profiles")
    .update({
      trial_started_at: startDate.toISOString(),
      trial_ends_at: endDate.toISOString(),
      trial_used: true
    })
    .eq("id", user.id)

  if (error) {
    console.error("Erro ao iniciar trial:", error)
    return { success: false, message: "Erro ao iniciar trial" }
  }

  if (shouldRevalidate) {
    revalidatePath("/dashboard")
  }
  return { success: true }
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
    trialEndsAt: profile.trial_ends_at,
    hasUsedTrial: profile.trial_used || false
  }
}

