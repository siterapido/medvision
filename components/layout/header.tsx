"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

interface HeaderProps {
  /**
   * Lado esquerdo do header (desktop)
   */
  leftContent?: React.ReactNode
  /**
   * Lado direito do header (desktop)
   */
  rightContent?: React.ReactNode
  /**
   * Conteúdo mobile esquerdo
   */
  mobileLeftContent?: React.ReactNode
  /**
   * Conteúdo mobile direito
   */
  mobileRightContent?: React.ReactNode
  /**
   * Callback para toggle do menu mobile
   */
  onToggleMenu?: () => void
  /**
   * Estado do menu (aberto/fechado)
   */
  isMenuOpen?: boolean
  /**
   * Mostrar logo
   */
  showLogo?: boolean
  /**
   * URL da logo
   */
  logoHref?: string
  /**
   * Classes CSS adicionais
   */
  className?: string
}

export function Header({
  leftContent,
  rightContent,
  mobileLeftContent,
  mobileRightContent,
  onToggleMenu,
  isMenuOpen = false,
  showLogo = true,
  logoHref = "/",
  className,
}: HeaderProps) {
  const renderMenuButton = () => {
    if (!onToggleMenu) return null

    return (
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMenuOpen}
        className={cn(
          "group flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
          isMenuOpen
            ? "border-violet-500/60 bg-slate-800/50 text-violet-300 [&_svg]:text-violet-300"
            : "border-slate-700/50 bg-slate-900/40 text-slate-400 hover:border-violet-500/35 hover:bg-slate-800/40 hover:text-white"
        )}
      >
        <Menu
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isMenuOpen ? "rotate-90 scale-110" : "rotate-0 group-hover:scale-110"
          )}
        />
      </button>
    )
  }

  return (
    <header
      className={cn(
        "border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2 shadow-lg transition-colors duration-200 md:px-6",
        isMenuOpen ? "border-violet-500/45" : "border-slate-800",
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          {renderMenuButton()}
          {showLogo && (
            <Link href={logoHref} aria-label="Página inicial" className="flex transition-opacity hover:opacity-80">
              <Logo width={120} height={28} variant="white" />
            </Link>
          )}
          {mobileLeftContent}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {mobileRightContent}
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {leftContent}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {rightContent}
        </div>
      </div>
    </header>
  )
}
