"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
}

interface DashboardSidebarContentProps {
  onClose?: () => void
  className?: string
}

export function DashboardSidebarTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 pb-6 pt-8">
      <Link href="/dashboard" aria-label="Dashboard" className="transition-opacity hover:opacity-80">
        <Logo width={120} height={32} variant="white" />
      </Link>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/50 text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span className="sr-only">Fechar menu</span>
        </button>
      )}
    </div>
  )
}

export function DashboardSidebarContent({
  onClose,
  className,
}: DashboardSidebarContentProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-1 flex-col px-3 pb-6", className)}>
      <nav aria-label="Navegação da dashboard" className="flex-1 space-y-1">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-primary/5 text-white border border-primary/30 shadow-md shadow-primary/5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent hover:border-slate-700/50",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "text-primary")} />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function DashboardSidebar({
  isVisible = true,
}: DashboardSidebarProps) {
  return (
    <aside
      id="dashboard-sidebar"
      aria-hidden={!isVisible}
      style={{ width: isVisible ? '200px' : '0' }}
      className={cn(
        "hidden flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl transition-all duration-300 ease-in-out md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto",
        isVisible
          ? "md:opacity-100 md:translate-x-0 md:pointer-events-auto"
          : "md:opacity-0 md:-translate-x-full md:pointer-events-none"
      )}
    >
      <DashboardSidebarTopBar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <DashboardSidebarContent />
      </div>
    </aside>
  )
}
