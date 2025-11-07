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
    <div className="min-h-screen bg-gradient-to-br from-[#0F192F] via-[#131D37] to-[#0B1627] text-slate-900">
      <div className="relative isolate min-h-screen overflow-hidden">
        {/* Glow background decorativo - azul suave */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#2399B4]/15 to-[#0891b2]/10 rounded-full blur-3xl opacity-25" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-br from-[#0891b2]/10 to-[#2399B4]/8 rounded-full blur-3xl opacity-15" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
