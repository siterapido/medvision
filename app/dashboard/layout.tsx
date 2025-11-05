import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] Dashboard layout rendering")

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] User fetch result:", { hasUser: !!user, error: error?.message })

    if (error || !user) {
      console.log("[v0] No user found, redirecting to login")
      redirect("/login")
    }

    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in dashboard layout:", error)
    redirect("/login")
  }
}
