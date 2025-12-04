"use client"

import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminHeaderProps {
  isSidebarVisible?: boolean
  onToggleSidebar?: () => void
}

export function AdminHeader({
  isSidebarVisible,
  onToggleSidebar,
}: AdminHeaderProps) {
  const toggleLabel = isSidebarVisible ? "Ocultar menu lateral" : "Mostrar menu lateral"

  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2 shadow-lg transition-colors duration-200 md:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={toggleLabel}
              aria-controls="admin-sidebar"
              aria-expanded={isSidebarVisible}
              title="Alternar menu lateral"
              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/40 text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-slate-800/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Menu className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
          <p className="text-sm font-medium text-slate-300">
            Painel Administrativo
          </p>
        </div>
      </div>
    </header>
  )
}








