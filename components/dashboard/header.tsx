"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { Menu, UserRound } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import type { DashboardProfile } from "@/components/dashboard/types"

interface DashboardHeaderProps {
  user: User
  profile: DashboardProfile | null
  isSidebarVisible?: boolean
  isDrawerOpen?: boolean
  onToggleSidebar?: () => void
  isLoggingOut?: boolean
  onLogout?: () => void
}

export function DashboardHeader({
  user,
  profile,
  isSidebarVisible,
  isDrawerOpen,
  onToggleSidebar,
  isLoggingOut,
  onLogout,
}: DashboardHeaderProps) {
  const displayName = profile?.name || user.email?.split("@")[0] || "Usuário"
  const firstName = displayName.split(" ")[0]
  const isLoggedIn = Boolean(user)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const desktopToggleLabel = isSidebarVisible ? "Ocultar menu lateral" : "Mostrar menu lateral"
  const mobileToggleLabel = isDrawerOpen ? "Fechar menu lateral" : "Abrir menu lateral"
  const mobileMenuOpen = Boolean(isDrawerOpen)
  const desktopMenuOpen = Boolean(isSidebarVisible)

  const renderDesktopButton = () => {
    if (!onToggleSidebar) {
      return null
    }

    return (
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={desktopToggleLabel}
        aria-controls="dashboard-sidebar"
        aria-expanded={desktopMenuOpen}
        title="Alternar menu lateral"
        className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/40 text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Menu className="h-4 w-4 transition-transform group-hover:scale-110" />
      </button>
    )
  }

  const renderMobileButton = () => {
    if (!onToggleSidebar) {
      return null
    }

    return (
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={mobileToggleLabel}
        aria-controls="dashboard-sidebar"
        aria-expanded={mobileMenuOpen}
        title="Alternar menu lateral"
        className={cn(
          "group flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          mobileMenuOpen
            ? "border-primary/50 bg-slate-800/50 text-primary"
            : "border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-primary/30 hover:bg-slate-800/40 hover:text-white",
        )}
      >
        <Menu
          className={cn(
            "h-5 w-5",
            "transition-all duration-300",
            mobileMenuOpen ? "rotate-90 scale-110" : "rotate-0 group-hover:scale-110",
          )}
        />
        <span className="sr-only">{mobileToggleLabel}</span>
      </button>
    )
  }

  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2 shadow-lg transition-colors duration-200 md:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/dashboard/cursos" aria-label="Ir para cursos" className="flex transition-opacity hover:opacity-80">
            <Logo width={120} height={28} variant="white" />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {renderMobileButton()}
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {renderDesktopButton()}
          <p className="text-sm font-medium text-slate-300">
            {getGreeting()}, <span className="font-semibold text-white">{firstName}</span>
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn && onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? "Saindo..." : "Logout"}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
