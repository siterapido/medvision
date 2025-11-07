import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirectTo=/admin")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const resolvedRole = resolveUserRole(profile?.role, user)

  if (resolvedRole !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-white to-sky-50">
        {/* Glow background decorativo - azul suave */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-sky-200/30 to-cyan-200/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-br from-cyan-100/20 to-sky-100/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
