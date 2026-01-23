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
    <header className="border-b border-[#24324F] bg-[#0F192F]/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2 transition-colors duration-200 md:px-6">
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
              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-[#24324F] bg-[#131D37] text-slate-400 transition-all duration-200 hover:border-[#0891b2]/50 hover:bg-[#1A2847] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891b2]"
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











