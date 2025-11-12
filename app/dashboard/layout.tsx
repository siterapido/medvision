import type React from "react"
import { DashboardLayoutShell } from "@/components/dashboard/shell"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { DashboardProfile } from "@/components/dashboard/types"

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

  return (
    <DashboardLayoutShell user={user} profile={profile}>
      {children}
    </DashboardLayoutShell>
  )
}
