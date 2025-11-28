"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { FloatingChat } from "@/components/chat/floating-chat"
import { DashboardHeader } from "@/components/dashboard/header"
import {
  DashboardSidebar,
  DashboardSidebarContent,
  DashboardSidebarTopBar,
} from "@/components/dashboard/sidebar"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"
import type { DashboardProfile } from "@/components/dashboard/types"
import type { User } from "@supabase/supabase-js"

interface DashboardLayoutShellProps {
  user: User
  profile: DashboardProfile | null
  children: React.ReactNode
}

export function DashboardLayoutShell({ user, profile, children }: DashboardLayoutShellProps) {
  const SIDEBAR_STORAGE_KEY = "dashboard-sidebar-visible"
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true
    }
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (storedValue === "false") {
      return false
    }
    return true
  })
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia("(min-width: 768px)").matches
  })
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
    }

    mediaQuery.addEventListener("change", handleMediaChange)
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarVisible))
  }, [isSidebarVisible])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsDrawerOpen(false)
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [pathname])

  useEffect(() => {
    if (!isDrawerOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isDrawerOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!(isDesktop && isDrawerOpen)) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setIsDrawerOpen(false)
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [isDesktop, isDrawerOpen])

  useEffect(() => {
    if (!isDrawerOpen || isDesktop) {
      return undefined
    }

    let startX: number | null = null
    const handleTouchStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (startX === null) {
        return
      }
      const currentX = event.touches[0].clientX
      if (startX - currentX > 60) {
        setIsDrawerOpen(false)
        startX = null
      }
    }

    const handleTouchEnd = () => {
      startX = null
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDrawerOpen, isDesktop])

  const handleToggleSidebar = () => {
    if (isDesktop) {
      setIsSidebarVisible((prev) => !prev)
    } else {
      setIsDrawerOpen((prev) => !prev)
    }
  }

  const closeDrawer = () => setIsDrawerOpen(false)

  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const planLabel = ((user.user_metadata ?? {}) as { plan?: string }).plan || "Free"
  const resolvedUserRole = resolveUserRole(profile?.role, user)
  const roleLabel = resolvedUserRole === "admin" ? "Administrador" : "Membro"

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
    <div className={`min-h-screen h-screen flex overflow-hidden ${pathname === '/dashboard/chat' || pathname === '/dashboard/cursos' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <DashboardSidebar
        isVisible={isSidebarVisible}
      />
      <div className={`flex flex-1 flex-col min-h-0 ${pathname === '/dashboard/chat' ? 'overflow-hidden' : ''}`}>
        <DashboardHeader
          user={user}
          profile={profile}
          isSidebarVisible={isSidebarVisible}
          isDrawerOpen={isDrawerOpen}
          onToggleSidebar={handleToggleSidebar}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />
        <main
          className={`flex flex-1 flex-col min-h-0 ${pathname === "/dashboard/chat" || pathname?.startsWith("/dashboard/cursos")
              ? "bg-transparent p-0 overflow-hidden"
              : "bg-[#eff4fb] pt-4 px-4 md:pt-6 md:px-6 lg:pt-8 lg:px-8 overflow-y-auto"
            }`}
        >
          {children}
        </main>
        <FloatingChat />
      </div>

      <>
        <div
          className={`fixed inset-0 z-40 bg-slate-950/75 transition-opacity duration-300 md:hidden ${isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          aria-hidden={!isDrawerOpen}
          onClick={closeDrawer}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[200px] max-w-[80vw] transform overflow-hidden transition-transform duration-300 md:hidden ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navegação da dashboard"
        >
          <div className="flex h-full flex-col divide-y divide-slate-900 border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 shadow-2xl">
            <DashboardSidebarTopBar onClose={closeDrawer} />
            <div className="flex flex-1 flex-col overflow-y-auto">
              <DashboardSidebarContent
                onClose={closeDrawer}
                className="px-6 pb-8"
                isLoggedIn={Boolean(user)}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </aside>
      </>
    </div>
  )
}
