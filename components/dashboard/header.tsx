"use client"

import { Badge } from "@/components/ui/badge"
import { resolveUserRole } from "@/lib/auth/roles"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
}

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const displayName = profile?.name || user.email?.split("@")[0] || "Usuário"
  const firstName = displayName.split(" ")[0]
  const resolvedRole = resolveUserRole(profile?.role, user)
  const roleLabel = resolvedRole === "admin" ? "Administrador" : "Cliente"

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(displayName)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 shadow-lg md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-100">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-400">
            Acompanhe suas conversas com IA, progresso nos cursos e recomendações personalizadas.
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {roleLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 md:flex">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-xs font-semibold uppercase text-primary ring-1 ring-primary/30">
              <div className="flex h-full w-full items-center justify-center">{initials}</div>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-100">{displayName}</p>
              <p className="text-xs text-slate-500">{profile?.email || user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
