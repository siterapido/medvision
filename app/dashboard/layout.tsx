import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/login")
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    return (
      <div className="flex min-h-screen bg-muted/60">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader user={user} profile={profile} />
          <main className="flex-1 overflow-y-auto bg-[#eff4fb] px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    )
  } catch {
    // Fallback: se houver erro ao criar cliente, redireciona para login
    redirect("/login")
  }
}
