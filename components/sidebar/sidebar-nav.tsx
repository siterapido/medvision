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
  planType?: string | null
}

export function SidebarNav({ role, planType }: SidebarNavProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const isAdmin = role === 'admin' || role === 'vendedor'

  const isActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true
    if (href !== '/admin' && pathname?.startsWith(href)) return true
    return false
  }

  const isTrialUser = planType === 'free' || !planType

  const mainNavItems = NAV_ITEMS.filter(item => !(item.hiddenForTrial && isTrialUser))

  // Short labels for collapsed state (Perplexity-style)
  const getShortLabel = (label: string) => {
    const shortLabels: Record<string, string> = {
      'Med Vision': 'Med',
      'Biblioteca': 'Biblioteca',
      'Radiografia': 'Radiografia',
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

  // Filter out 'Histórico' from main nav on desktop
  // It should only appear on mobile
  const { isMobile } = useSidebar()

  const filteredNavItems = mainNavItems.filter(item => {
    if (item.label === 'Histórico' && !isMobile) {
      return false
    }
    return true
  })

  return (
    <>
      <SidebarGroup>
        {!isCollapsed && (
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Navegação
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => {
              const active = isActive(item.href)
              return (

                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={active}
                    tooltip={isCollapsed ? undefined : item.label}
                    className={cn(
                      'transition-colors duration-200',
                      active && 'bg-sidebar-accent text-sidebar-foreground font-medium',
                      !active && !item.disabled && 'hover:bg-sidebar-accent/60',
                      item.disabled && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {item.disabled ? (
                      <div className="flex w-full items-center gap-2">
                        <item.icon className={cn(
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                          'text-muted-foreground'
                        )} />
                        {!isCollapsed && (
                          <div className="flex flex-1 items-center justify-between overflow-hidden">
                            <span className={cn(
                              'text-muted-foreground truncate'
                            )}>
                              {item.label}
                            </span>
                            {item.badgeText && (
                              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase font-bold leading-none tracking-wide text-muted-foreground whitespace-nowrap">
                                {item.badgeText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link href={item.href}>
                        <item.icon className={cn(
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                          active ? 'text-sidebar-foreground' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          active ? 'text-sidebar-foreground' : 'text-muted-foreground',
                          isCollapsed && 'text-[10px] leading-tight'
                        )}>
                          {isCollapsed ? getShortLabel(item.label) : item.label}
                        </span>
                      </Link>
                    )}
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
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Painel admin
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
                        'transition-colors duration-200',
                        active && 'bg-sidebar-accent text-sidebar-foreground font-medium',
                        !active && 'hover:bg-sidebar-accent/60'
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn(
                          'shrink-0',
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                          active ? 'text-sidebar-foreground' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          active ? 'text-sidebar-foreground' : 'text-muted-foreground',
                          isCollapsed && 'text-[10px] leading-tight'
                        )}>
                          {isCollapsed ? getShortLabel(item.label) : item.label}
                        </span>
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
