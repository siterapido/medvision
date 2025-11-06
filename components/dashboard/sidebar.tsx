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

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-72 flex-col border-r border-sidebar-border/40 bg-[radial-gradient(circle_at_top,_rgba(35,153,180,0.35),_transparent_65%),_linear-gradient(180deg,_#0f192f,_#050b18)] text-sidebar-foreground md:flex">
      <div className="flex flex-col gap-2 px-6 pb-6 pt-10">
        <Link href="/dashboard" aria-label="Dashboard" className="flex items-center gap-2">
          <Logo width={140} height={36} variant="white" />
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Odonto GPT</p>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          Plano atual: <span className="font-semibold text-white">Free</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white shadow-[0_0_25px_rgba(8,145,178,0.35)]"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 space-y-4 px-4 pb-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5 p-4 text-sm text-white/90">
          <p className="font-semibold text-white">Desbloqueie o modo Expert</p>
          <p className="mt-1 text-xs text-white/70">Modelos clínicos avançados, mais mensagens e segunda opinião assistida.</p>
          <Button asChild size="sm" className="mt-3 w-full bg-white text-slate-900 hover:bg-primary hover:text-white">
            <Link href="/dashboard/assinatura">Fazer upgrade</Link>
          </Button>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Link>
      </div>
    </aside>
  )
}
