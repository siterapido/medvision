"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { X, type LucideIcon } from "lucide-react"

export interface SidebarNavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface SidebarProps {
  /**
   * Array de itens de navegação
   */
  items: SidebarNavItem[]
  /**
   * Largura da sidebar em pixels
   */
  width?: number
  /**
   * Sidebar visível (para toggle desktop)
   */
  isVisible?: boolean
  /**
   * Callback quando fecha (mobile)
   */
  onClose?: () => void
  /**
   * Conteúdo do topo (ex: logo)
   */
  topContent?: React.ReactNode
  /**
   * Conteúdo do rodapé
   */
  bottomContent?: React.ReactNode
  /**
   * Classes CSS adicionais
   */
  className?: string
}

export function SidebarTopBar({
  onClose,
  children,
}: {
  onClose?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-6 pt-8">
      {children}
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

export function SidebarContent({
  items,
  onClose,
  className,
}: {
  items: SidebarNavItem[]
  onClose?: () => void
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-1 flex-col px-3 pb-6", className)}>
      <nav aria-label="Navegação" className="flex-1 space-y-1">
        {items.map((item) => {
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
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent hover:border-slate-700/50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive && "text-primary"
                )}
              />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar({
  items,
  width = 200,
  isVisible = true,
  topContent,
  bottomContent,
  className,
}: SidebarProps) {
  return (
    <aside
      style={{ width: isVisible ? `${width}px` : "0" }}
      className={cn(
        "hidden flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl transition-all duration-300 ease-in-out md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto",
        isVisible
          ? "md:opacity-100 md:translate-x-0 md:pointer-events-auto"
          : "md:opacity-0 md:-translate-x-full md:pointer-events-none",
        className
      )}
    >
      {topContent && <SidebarTopBar>{topContent}</SidebarTopBar>}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <SidebarContent items={items} />
      </div>
      {bottomContent && <div className="p-4">{bottomContent}</div>}
    </aside>
  )
}

/**
 * Drawer mobile para sidebar
 */
export function SidebarDrawer({
  items,
  width = 200,
  isOpen = false,
  onClose,
  topContent,
  bottomContent,
}: {
  items: SidebarNavItem[]
  width?: number
  isOpen?: boolean
  onClose: () => void
  topContent?: React.ReactNode
  bottomContent?: React.ReactNode
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/75 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[${width}px] max-w-[80vw] transform overflow-hidden transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navegação"
      >
        <div className="flex h-full flex-col divide-y divide-slate-900 border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 shadow-2xl">
          <SidebarTopBar onClose={onClose}>{topContent}</SidebarTopBar>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <SidebarContent items={items} onClose={onClose} className="px-6 pb-8" />
          </div>
          {bottomContent && <div className="p-4">{bottomContent}</div>}
        </div>
      </aside>
    </>
  )
}
