import type React from "react"
import { DashboardLayoutShell } from "@/components/dashboard/shell"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { DashboardProfile } from "@/components/dashboard/types"
import { startTrial } from "@/app/actions/trial"

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

  // Ativação automática do trial no primeiro acesso
  if (profile && !profile.trial_used && (!profile.plan_type || profile.plan_type === "free")) {
    await startTrial(false)
    // Recarrega o profile após ativar o trial
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<DashboardProfile>()
      
    if (updatedProfile) {
      Object.assign(profile, updatedProfile)
    }
  }

  return (
    <DashboardLayoutShell user={user} profile={profile}>
      {children}
    </DashboardLayoutShell>
  )
}
