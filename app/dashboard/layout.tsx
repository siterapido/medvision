import type React from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { startTrial } from "@/app/actions/trial"
import { DashboardLayoutShell } from "@/components/dashboard/shell"
import type { DashboardProfile } from "@/components/dashboard/types"
import { calculateTrialEndDate, getTrialDurationFromDates, isTrialExpired, normalizeTrialDays } from "@/lib/trial"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<DashboardProfile>()

  const hasActivePlan = profile?.plan_type && profile.plan_type !== "free"

  const requestedTrialDays = normalizeTrialDays(
    typeof user.user_metadata?.trial_days === "number" ? user.user_metadata.trial_days : undefined
  )

  // Ajusta a duração do trial conforme a origem do cadastro, sem liberar para premium
  // Verifica se há um trial ativo (não expirado) para ajustar a duração
  if (
    profile &&
    !hasActivePlan &&
    profile.trial_started_at &&
    profile.trial_ends_at &&
    !isTrialExpired(profile.trial_ends_at)
  ) {
    const currentDuration = getTrialDurationFromDates(
      profile.trial_started_at,
      profile.trial_ends_at,
      requestedTrialDays
    )

    if (currentDuration !== requestedTrialDays) {
      const newEnd = calculateTrialEndDate(new Date(profile.trial_started_at), requestedTrialDays)

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update({ trial_ends_at: newEnd.toISOString() })
        .eq("id", user.id)
        .select("*")
        .single<DashboardProfile>()

      if (updatedProfile) {
        Object.assign(profile, updatedProfile)
      }
    }
  }

  // Ativação automática do trial no primeiro acesso (apenas se ainda não iniciado)
  if (
    profile &&
    !hasActivePlan &&
    !profile.trial_used &&
    !profile.trial_started_at
  ) {
    await startTrial({ shouldRevalidate: false, days: requestedTrialDays })
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<DashboardProfile>()

    if (updatedProfile) {
      Object.assign(profile, updatedProfile)
    }
  }

  // Verificação de expiração do Trial (Movido do middleware para cá para evitar timeout)
  const headerList = await headers()
  const pathname = headerList.get("x-pathname") || ""

  const trialExpired = isTrialExpired(profile?.trial_ends_at)
  const hasTrialStarted = !!profile?.trial_started_at

  if (!hasActivePlan && hasTrialStarted && trialExpired) {
    // Rotas permitidas mesmo com trial expirado
    const allowedPaths = [
      "/dashboard/upgrade",
      "/dashboard/assinatura",
      "/dashboard/perfil",
    ]

    const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path))

    if (!isAllowedPath) {
      redirect("/dashboard/upgrade")
    }
  }

  return (
    <DashboardLayoutShell user={user} profile={profile}>
      {children}
    </DashboardLayoutShell>
  )
}
