"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
}

interface AdminLayoutShellProps {
  user: User
  profile: Profile | null
  children: React.ReactNode
}

export function AdminLayoutShell({ user, profile, children }: AdminLayoutShellProps) {
  const SIDEBAR_STORAGE_KEY = "admin-sidebar-visible"
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarVisible))
  }, [isSidebarVisible])

  const handleToggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false)
  }

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <AdminSidebar
        user={user}
        profile={profile}
        isVisible={isSidebarVisible}
        onClose={handleCloseSidebar}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex flex-1 flex-col overflow-y-auto bg-muted/30 p-0">
          <div className="mx-auto w-full max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}












