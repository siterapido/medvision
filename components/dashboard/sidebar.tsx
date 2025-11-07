"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  BotIcon,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  role: string
}

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
}

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

const navigation: NavItem[] = [
  { name: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat de IA", href: "/dashboard/chat", icon: BotIcon },
  { name: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { name: "Perfil", href: "/dashboard/perfil", icon: UserRound },
  { name: "Assinatura", href: "/dashboard/assinatura", icon: Sparkles },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const userEmail = profile?.email || user.email || ""
  const userName = profile?.full_name || user.email?.split("@")[0] || "Usuário"

  return (
    <aside className="hidden min-h-screen w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl md:flex">
      <div className="flex flex-col gap-3 px-6 pb-6 pt-10">
        <Link href="/dashboard" aria-label="Dashboard" className="flex items-center gap-2">
          <Logo width={140} height={36} variant="white" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 text-white border border-primary/30 shadow-lg shadow-primary/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 px-4 pb-8">
        <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-white truncate mb-1" title={userName}>
            {userName}
          </p>
          <p className="text-xs text-slate-400 truncate mb-2" title={userEmail}>
            {userEmail}
          </p>
          <div className="text-sm text-slate-200 pt-2 border-t border-slate-700">
            Plano: <span className="font-semibold text-white">Free</span>
          </div>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Link>
      </div>
    </aside>
  )
}
