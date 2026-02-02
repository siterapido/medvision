"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { resolveUserRole } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import {
  Award,
  BookOpen,
  Bot,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Calendar,
  MessageSquare,
  Sparkles,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
}

interface AdminSidebarProps {
  user: User
  profile: Profile | null
  isVisible?: boolean
  onClose?: () => void
}

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

const allNavigationItems: NavItem[] = [
  { name: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { name: "Gerenciar Cursos", href: "/admin/cursos", icon: BookOpen },
  { name: "Materiais", href: "/admin/materiais", icon: FileText },
  { name: "Cadastrar Lives", href: "/admin/lives", icon: Calendar },
  { name: "Notificações", href: "/admin/notifications", icon: MessageSquare },
  { name: "Agentes IA", href: "/admin/agentes", icon: Bot },
  { name: "Funis", href: "/admin/funnels", icon: LayoutGrid },
  { name: "Pipeline", href: "/admin/pipeline", icon: Workflow },
  { name: "Trials", href: "/admin/trials", icon: Sparkles },
  { name: "Certificados", href: "/admin/certificados", icon: Award },
  { name: "Usuários", href: "/admin/usuarios", icon: Users },
]

const vendedorNavigationItems: NavItem[] = [
  { name: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { name: "Funis", href: "/admin/funnels", icon: LayoutGrid },
  { name: "Pipeline", href: "/admin/pipeline", icon: Workflow },
]

export function AdminSidebar({ user, profile, isVisible = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const userEmail = profile?.email || user.email || ""
  const userName = profile?.name || user.email?.split("@")[0] || "Usuário"
  const resolvedRole = resolveUserRole(profile?.role, user)
  const userRoleLabel = resolvedRole === "admin" ? "Administrador" : resolvedRole === "vendedor" ? "Vendedor" : "Cliente"

  const navigation = resolvedRole === "vendedor" ? vendedorNavigationItems : allNavigationItems

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.replace("/login")
    } catch (error) {
      console.error("[admin] Failed to logout user", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen",
          isVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0"
        )}
      >
        <div className="flex items-center justify-between px-6 pb-6 pt-10">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2">
            <Logo width={140} height={36} variant="auto" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Painel Administrativo
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const matchingItem = navigation
              .filter((navItem) => {
                if (navItem.href === "/admin") return pathname === "/admin"
                return pathname === navItem.href || pathname.startsWith(navItem.href + "/")
              })
              .sort((a, b) => b.href.length - a.href.length)[0]

            const isActive = matchingItem?.href === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { if (window.innerWidth < 768) onClose?.() }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4 space-y-3">
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <p className="text-xs font-semibold text-foreground truncate" title={userName}>
              {userName}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mb-2" title={userEmail}>
              {userEmail}
            </p>
            <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
              Role: <span className="font-semibold text-foreground">{userRoleLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </aside>
    </>
  )
}
