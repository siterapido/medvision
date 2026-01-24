'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  role?: string | null
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const isAdmin = role === 'admin' || role === 'vendedor'

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href === '/admin' && pathname === '/admin') return true
    if (href !== '/dashboard' && href !== '/admin' && pathname?.startsWith(href)) return true
    return false
  }

  // Filter out Chat from main nav since we have a dedicated CTA
  const mainNavItems = NAV_ITEMS.filter(item => item.href !== '/dashboard/chat')

  // Short labels for collapsed state (Perplexity-style)
  const getShortLabel = (label: string) => {
    const shortLabels: Record<string, string> = {
      'Início': 'Início',
      'Biblioteca': 'Biblioteca',
      'OdontoFlix': 'Flix',
      'Odonto Vision': 'Vision',
      'Certificados': 'Certific.',
      'Histórico': 'Histórico',
      'Visão Geral': 'Admin',
      'Cursos': 'Cursos',
      'Materiais': 'Mats',
      'Agentes IA': 'IA',
      'Usuários': 'Users',
    }
    return shortLabels[label] || label
  }

  return (
    <>
      <SidebarGroup>
        {!isCollapsed && (
          <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
            Navegacao
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={isCollapsed ? undefined : item.label}
                    className={cn(
                      'transition-all duration-200',
                      active && 'bg-[var(--sidebar-active)] text-primary font-medium',
                      !active && 'hover:bg-[var(--sidebar-hover)]'
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn(
                        'shrink-0',
                        isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                        active ? 'text-primary' : 'text-[var(--sidebar-text-secondary)]'
                      )} />
                      <span className={cn(
                        active ? 'text-[var(--sidebar-text-primary)]' : 'text-[var(--sidebar-text-secondary)]',
                        isCollapsed && 'text-[10px] leading-tight'
                      )}>
                        {isCollapsed ? getShortLabel(item.label) : item.label}
                      </span>
                      {active && !isCollapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isAdmin && (
        <SidebarGroup className="mt-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
              Painel Admin
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={isCollapsed ? undefined : item.label}
                      className={cn(
                        'transition-all duration-200',
                        active && 'bg-[var(--sidebar-active)] text-primary font-medium',
                        !active && 'hover:bg-[var(--sidebar-hover)]'
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn(
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                          active ? 'text-primary' : 'text-[var(--sidebar-text-secondary)]'
                        )} />
                        <span className={cn(
                          active ? 'text-[var(--sidebar-text-primary)]' : 'text-[var(--sidebar-text-secondary)]',
                          isCollapsed && 'text-[10px] leading-tight'
                        )}>
                          {isCollapsed ? getShortLabel(item.label) : item.label}
                        </span>
                        {active && !isCollapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}
