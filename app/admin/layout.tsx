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
    <div className="min-h-screen bg-[#030817] text-slate-50">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.16),_transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_bottom,_rgba(8,145,178,0.12),_transparent_65%)] opacity-90" />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
