"use client"

import { Badge } from "@/components/ui/badge"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  role: string
}

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuário"
  const firstName = displayName.split(" ")[0]

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
    <header className="border-b border-border/60 bg-white/90 px-6 py-4 shadow-sm backdrop-blur md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Painel clínico</p>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Beta IA
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas conversas com IA, progresso nos cursos e recomendações personalizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 rounded-full border border-border/80 bg-white px-3 py-1.5 md:flex">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary ring-1 ring-primary/20">
              <div className="flex h-full w-full items-center justify-center">{initials}</div>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
