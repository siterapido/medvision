"use client"

import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"

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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 px-4 py-3 transition-colors duration-200 md:px-6">
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
              className="group flex h-9 w-9 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Painel Administrativo
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle collapsed={true} />
        </div>
      </div>
    </header>
  )
}












