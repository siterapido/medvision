import type React from "react"
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

    // Check if user is admin or vendedor
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    const userRole = resolveUserRole(profile?.role, user)

    if (userRole !== "admin" && userRole !== "vendedor") {
      redirect("/dashboard")
    }

    return (
      <>
        {children}
      </>
    )
  } catch {
    // Fallback: se houver erro ao criar cliente, redireciona para login
    redirect("/login")
  }
}
