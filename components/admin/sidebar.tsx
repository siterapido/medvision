"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { resolveUserRole } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  Calendar,
  MessageSquare,
  Sparkles,
  Users,
  Workflow,
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
  { name: "Pipeline", href: "/admin/pipeline", icon: Workflow },
  { name: "Trials", href: "/admin/trials", icon: Sparkles },
  { name: "Usuários", href: "/admin/usuarios", icon: Users },
]

// Itens de navegação permitidos para vendedores
const vendedorNavigationItems: NavItem[] = [
  { name: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { name: "Pipeline", href: "/admin/pipeline", icon: Workflow },
]

export function AdminSidebar({ user, profile, isVisible = true }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userEmail = profile?.email || user.email || ""
  const userName = profile?.name || user.email?.split("@")[0] || "Usuário"
  const resolvedRole = resolveUserRole(profile?.role, user)
  const userRoleLabel = resolvedRole === "admin" ? "Administrador" : resolvedRole === "vendedor" ? "Vendedor" : "Cliente"

  // Filtrar navegação baseado no role
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
    <aside
      id="admin-sidebar"
      aria-hidden={!isVisible}
      style={{ width: isVisible ? '288px' : '0' }}
      className={cn(
        "hidden flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl transition-all duration-300 ease-in-out md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto",
        isVisible
          ? "md:opacity-100 md:translate-x-0 md:pointer-events-auto"
          : "md:opacity-0 md:-translate-x-full md:pointer-events-none"
      )}
    >
      <div className="flex flex-col gap-3 px-6 pb-6 pt-10">
        <Link href="/admin" aria-label="Admin Dashboard" className="flex items-center gap-2">
          <Logo width={140} height={36} variant="white" />
        </Link>
        <p className="text-xs text-slate-500 font-medium">PAINEL ADMINISTRATIVO</p>
      </div>

      <nav className="flex-1 space-y-1.5 px-4">
        {navigation.map((item) => {
          const Icon = item.icon
          // Garante que apenas um item seja selecionado por vez
          // Encontra o item mais específico que corresponde ao pathname atual
          const matchingItem = navigation
            .filter((navItem) => {
              if (navItem.href === "/admin") {
                return pathname === "/admin"
              }
              return pathname === navItem.href || pathname.startsWith(navItem.href + "/")
            })
            .sort((a, b) => b.href.length - a.href.length)[0] // Ordena por maior comprimento (mais específico)

          const isActive = matchingItem?.href === item.href

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
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
            Função: <span className="font-semibold text-white">{userRoleLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>
  )
}
