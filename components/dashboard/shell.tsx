"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import { NewSidebar } from "@/components/dashboard/new-sidebar"
import {
  DashboardSidebarContent,
  DashboardSidebarTopBar,
} from "@/components/dashboard/sidebar"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"
import type { DashboardProfile } from "@/components/dashboard/types"
import type { User } from "@supabase/supabase-js"
import { TrialCountdownBanner } from "@/components/trial/trial-countdown-banner"
import { Logo } from "@/components/logo"

interface DashboardLayoutShellProps {
  user: User
  profile: DashboardProfile | null
  children: React.ReactNode
}

export function DashboardLayoutShell({ user, profile, children }: DashboardLayoutShellProps) {
  const SIDEBAR_STORAGE_KEY = "dashboard-sidebar-collapsed"
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Estado para controlar se a sidebar está colapsada (Desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false // Padrão expandido
    }
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return storedValue === "true"
  })

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia("(min-width: 768px)").matches
  })
  
  const pathname = usePathname()

  // Monitora resize para desktop
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
    }

    mediaQuery.addEventListener("change", handleMediaChange)
    return () => mediaQuery.removeEventListener("change", handleMediaChange)
  }, [])

  // Persiste estado da sidebar
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  // Fecha drawer ao navegar
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  // Gerencia scroll do body quando drawer abre
  useEffect(() => {
    if (!isDrawerOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isDrawerOpen])

  // Fecha drawer com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev)
  }

  const closeDrawer = () => setIsDrawerOpen(false)

  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      setIsDrawerOpen(false)
      router.replace("/login")
    } catch (error) {
      console.error("[dashboard] Failed to logout user", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (New Style) */}
      <div className="hidden md:block h-full shrink-0 z-30">
        <NewSidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={handleToggleSidebar}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <button onClick={() => setIsDrawerOpen(true)} className="p-2 -ml-2 hover:bg-muted rounded-md">
            <Menu className="w-6 h-6" />
          </button>
          <Logo width={100} height={24} />
          <div className="w-8" /> {/* Spacer para centralizar logo visualmente */}
        </div>

        {/* Banner de Trial */}
        <TrialCountdownBanner
          trialEndsAt={profile?.trial_ends_at}
          planType={profile?.plan_type}
        />

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative w-full">
           {children}
        </main>
      </div>

      {/* Mobile Drawer (Overlay) */}
      <>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
            isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={closeDrawer}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[240px] max-w-[80vw] bg-sidebar border-r border-border shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <DashboardSidebarTopBar onClose={closeDrawer} />
          <div className="flex-1 overflow-y-auto">
             <DashboardSidebarContent
                onClose={closeDrawer}
                isLoggedIn={Boolean(user)}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
                // isTrialExpired={...} // Se necessário passar
             />
          </div>
        </aside>
      </>
    </div>
  )
}
