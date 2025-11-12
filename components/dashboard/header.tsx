"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardProfile } from "@/components/dashboard/types"
import { dashboardNavigation } from "@/components/dashboard/sidebar"

interface DashboardHeaderProps {
  user: User
  profile: DashboardProfile | null
  isSidebarVisible?: boolean
  onToggleSidebar?: () => void
}

const essentialNavigation = dashboardNavigation.slice(0, 3)

export function DashboardHeader({
  user,
  profile,
  isSidebarVisible,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const displayName = profile?.name || user.email?.split("@")[0] || "Usuário"
  const firstName = displayName.split(" ")[0]
  const pathname = usePathname()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.7)] backdrop-blur-sm backdrop-saturate-150 transition-colors duration-200 md:px-6">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={isSidebarVisible ? "Ocultar menu lateral" : "Mostrar menu lateral"}
              aria-controls="dashboard-sidebar"
              aria-expanded={Boolean(isSidebarVisible)}
              title="Alternar menu lateral"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-200 transition hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <p className="text-sm font-semibold text-slate-100 md:text-base">
            {getGreeting()}, {firstName}
          </p>
        </div>

        <nav
          aria-label="Navegação essencial"
          className="flex flex-1 flex-wrap items-center justify-start gap-2 md:justify-center md:gap-3"
        >
          {essentialNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/10 text-white shadow-lg shadow-primary/10"
                    : "border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-100",
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-slate-400")} />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
