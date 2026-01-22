'use client'

import { useState, createContext, useContext, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  MessageCircle,
  BookOpen,
  MonitorPlay,
  Eye,
  FileBadge,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell
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
  shortcut?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
  { href: '/dashboard/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/dashboard/odontoflix', label: 'OdontoFlix', icon: MonitorPlay },
  { href: '/dashboard/odonto-vision', label: 'Odonto Vision', icon: Eye },
  { href: '/dashboard/certificados', label: 'Certificados', icon: FileBadge },
]

const bottomNavItems: NavItem[] = [
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
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

  // Auto-collapse on mobile (handled by CSS primarily but state helps)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }
    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-sidebar border-r border-sidebar-border backdrop-blur-xl',
          'transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth implementation
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Header with Logo */}
        <div className={cn(
          "flex items-center justify-between px-6 py-10",
          isCollapsed ? "justify-center px-0" : ""
        )}>
          <Link href="/dashboard" className="relative flex items-center justify-center group">
            <Logo width={isCollapsed ? 40 : 120} height={isCollapsed ? 40 : 40} variant="white" className="transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
          </Link>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 border border-transparent hover:border-sidebar-border"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">

          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                  isCollapsed
                    ? 'flex-col justify-center gap-1 p-2 h-auto min-h-[64px]'
                    : 'flex-row gap-3 px-3 py-2.5'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={cn(
                  "relative flex items-center justify-center transition-transform duration-200",
                  active && "scale-105",
                  !active && "group-hover:scale-110"
                )}>
                  <item.icon className={cn(
                    "shrink-0 transition-all duration-300",
                    isCollapsed ? "h-6 w-6" : "h-5 w-5",
                    active ? "text-primary stroke-[2.5px]" : "group-hover:text-sidebar-foreground stroke-[1.5px]"
                  )} />
                  {active && <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />}
                </div>

                {isCollapsed ? (
                  <span className="text-[10px] font-medium text-center leading-none text-sidebar-muted group-hover:text-sidebar-foreground truncate max-w-full">
                    {item.label}
                  </span>
                ) : (
                  <span className="truncate flex-1 font-sans">{item.label}</span>
                )}

                {/* Active Indicator (Dot) - Only in expanded or refined for collapsed */}
                {active && !isCollapsed && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shadow shadow-primary/50 animate-pulse-soft" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center rounded-xl text-sm font-medium transition-all',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                isCollapsed
                  ? 'flex-col justify-center gap-1 p-2 h-auto'
                  : 'flex-row gap-3 px-3 py-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                {item.label === 'Notificações' && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border-2 border-sidebar" />
                )}
              </div>
              {isCollapsed ? (
                <span className="text-[10px] font-medium text-center leading-none text-sidebar-muted group-hover:text-sidebar-foreground">
                  {item.label === 'Notificações' ? '' : item.label}
                </span>
              ) : (
                <span>{item.label}</span>
              )}
            </Link>
          ))}

          <div className="flex items-center gap-2 justify-between pt-2">
            <UserProfile user={user} collapsed={isCollapsed} />
          </div>
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
      className="lg:hidden p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
      aria-label="Abrir menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
