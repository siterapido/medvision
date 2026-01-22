'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Home,
  Library,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Play,
} from 'lucide-react'
import { Logo } from "@/components/logo"
import { UserProfile } from './user-profile'
import { ThemeToggle } from './theme-toggle'

// Context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => { },
})

export const useSidebar = () => useContext(SidebarContext)

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chat', label: 'Chat', icon: Sparkles },
  { href: '/dashboard/biblioteca', label: 'Biblioteca', icon: Library },
  { href: '/dashboard/odontoflix', label: 'OdontoFlix', icon: Play },
  { href: '/dashboard/certificados', label: 'Certificados', icon: Award },
]

const bottomNavItems: NavItem[] = [
  { href: '/dashboard/configuracoes', label: 'Configuracoes', icon: Settings },
]

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-sidebar border-r border-sidebar-border',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header with Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center justify-center h-8 shrink-0">
              <Logo width={isCollapsed ? 32 : 120} height={32} />
            </div>
            <span
              className={cn(
                'font-semibold text-sidebar-foreground whitespace-nowrap transition-opacity duration-200 sr-only',
              )}
            >
              Odonto GPT
            </span>
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground',
              'hover:bg-sidebar-accent transition-colors',
              isCollapsed && 'mx-auto'
            )}
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'transition-all duration-150',
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity duration-200',
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  )}
                >
                  {item.label}
                </span>
                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Theme Toggle */}
          <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'px-3 py-2')}>
            <ThemeToggle collapsed={isCollapsed} />
          </div>

          {/* Settings */}
          {bottomNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  'transition-all duration-150',
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity duration-200',
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* User Profile */}
          <UserProfile user={user} collapsed={isCollapsed} />
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}

// Mobile sidebar trigger
export function MobileSidebarTrigger() {
  const { setIsCollapsed } = useSidebar()

  return (
    <button
      onClick={() => setIsCollapsed(false)}
      className="lg:hidden p-2 rounded-md hover:bg-accent"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
