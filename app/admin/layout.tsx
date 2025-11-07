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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="relative isolate min-h-screen overflow-hidden">
        {/* Glow background decorativo - azul suave */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#06b6d4]/8 to-[#0891b2]/5 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-br from-[#0891b2]/6 to-[#06b6d4]/4 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
