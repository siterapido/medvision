"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import {
  BotIcon,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export const dashboardNavigation: NavItem[] = [
  { name: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat de IA", href: "/dashboard/chat", icon: BotIcon },
  { name: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { name: "Materiais", href: "/dashboard/materiais", icon: BookOpen },
  { name: "Perfil", href: "/dashboard/perfil", icon: UserRound },
  { name: "Assinatura", href: "/dashboard/assinatura", icon: Sparkles },
]

interface DashboardSidebarProps {
  isVisible?: boolean
  planLabel: string
  roleLabel?: string
  isLoggingOut?: boolean
  onLogout?: () => void
}

interface DashboardSidebarContentProps {
  onClose?: () => void
  className?: string
  planLabel: string
  roleLabel: string
}

export function DashboardSidebarTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 pb-6 pt-10">
      <Link href="/dashboard" aria-label="Dashboard">
        <Logo width={140} height={36} variant="white" />
      </Link>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar menu</span>
        </button>
      )}
    </div>
  )
}

export function DashboardSidebarContent({
  onClose,
  className,
  planLabel,
  roleLabel,
}: DashboardSidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      onClose?.()
      router.replace("/login")
    } catch (error) {
      console.error("[dashboard] Failed to logout user", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={cn("flex h-full flex-1 flex-col px-4 pb-6", className)}>
      <nav aria-label="Navegação da dashboard" className="flex-1 space-y-1.5">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose?.()}
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

      <div className="mt-auto border-t border-slate-900 px-4 pt-6 text-left">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
          <span>Plano</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
            {planLabel}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
          <span>Função</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
            {roleLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-4 w-full rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition hover:border-slate-500 hover:bg-slate-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  )
}

export function DashboardSidebar({ isVisible = true, planLabel, roleLabel = "Membro" }: DashboardSidebarProps) {
  const visibilityClasses = isVisible
    ? "md:w-72 md:opacity-100 md:translate-x-0 md:pointer-events-auto"
    : "md:w-0 md:opacity-0 md:-translate-x-full md:pointer-events-none"

  return (
    <aside
      id="dashboard-sidebar"
      aria-hidden={!isVisible}
      className={cn(
        "hidden flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl transition-all duration-300 ease-in-out md:flex md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-3.5rem)] md:overflow-y-auto",
        visibilityClasses,
      )}
    >
      <DashboardSidebarTopBar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <DashboardSidebarContent planLabel={planLabel} roleLabel={roleLabel} />
      </div>
    </aside>
  )
}
