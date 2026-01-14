"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { WhatsAppModal } from "@/components/marketing/whatsapp-modal"
import {
  BotIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  UserRound,
  X,
  FileText,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export const dashboardNavigation: NavItem[] = [
  { name: "OdontoGPT Chat", href: "/dashboard/chat", icon: BotIcon },
  { name: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { name: "Resumos", href: "/dashboard/resumos", icon: FileText },
  { name: "Materiais", href: "/dashboard/materiais", icon: BookOpen },
  { name: "Perfil", href: "/dashboard/perfil", icon: UserRound },
  { name: "Assinatura", href: "/dashboard/assinatura", icon: Sparkles },
]

interface DashboardSidebarProps {
  isVisible?: boolean
  isTrialExpired?: boolean
}

interface DashboardSidebarContentProps {
  onClose?: () => void
  className?: string
  onLogout?: (() => void) | null
  isLoggingOut?: boolean
  isLoggedIn?: boolean
  isTrialExpired?: boolean
}

export function DashboardSidebarTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 pb-6 pt-8">
      <Link href="/dashboard/chat" aria-label="Dashboard" className="transition-opacity hover:opacity-80">
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
  onLogout,
  isLoggingOut = false,
  isLoggedIn,
  isTrialExpired = false,
}: DashboardSidebarContentProps) {
  const pathname = usePathname()
  const isAuthenticated = Boolean(isLoggedIn)
  const showLogoutButton = isAuthenticated && Boolean(onLogout)

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

      {/* Card do WhatsApp no final */}
      {!isTrialExpired ? (
        <div className="mt-auto pt-4 px-3">
          <WhatsAppModal>
            <button
              onClick={() => onClose?.()}
              className={cn(
                "group relative flex flex-col gap-2 rounded-xl p-4 transition-all duration-200 overflow-hidden w-full text-left",
                "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:shadow-md hover:shadow-emerald-500/5"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
              <div className="relative flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                  "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300"
                )}>
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-semibold leading-tight",
                    "text-emerald-200 group-hover:text-emerald-100"
                  )}>
                    WhatsApp
                  </p>
                  <p className="text-[10px] text-emerald-400/70 mt-0.5">
                    Converse conosco
                  </p>
                </div>
              </div>
            </button>
          </WhatsAppModal>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 px-3 md:hidden">
        {showLogoutButton ? (
          <button
            type="button"
            onClick={() => {
              onClose?.()
              onLogout?.()
            }}
            disabled={isLoggingOut}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingOut ? "Saindo..." : "Logout"}
          </button>
        ) : (
          <Link
            href="/login"
            onClick={() => onClose?.()}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  )
}

export function DashboardSidebar({
  isVisible = true,
  isTrialExpired = false,
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
        <DashboardSidebarContent isTrialExpired={isTrialExpired} />
      </div>
    </aside>
  )
}
