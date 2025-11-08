import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"

export default async function AdminLayout({
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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    const userRole = resolveUserRole(profile?.role, user)

    if (userRole !== "admin") {
      redirect("/dashboard")
    }

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AdminSidebar user={user} profile={profile} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 md:px-8">
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
