'use client'

import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader as BaseSidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { SidebarHeader } from './sidebar-header'
import { SidebarNav } from './sidebar-nav'
import { SidebarUser } from './sidebar-user'
import { cn } from '@/lib/utils'

interface UnifiedSidebarProps {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
    plan_type?: string | null
    subscription_status?: string | null
    role?: string | null
  }
}

export function UnifiedSidebar({ user }: UnifiedSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'border-r border-sidebar-border',
        'bg-transparent'
      )}
    >
      <BaseSidebarHeader className={cn(
        isCollapsed ? 'p-2' : 'p-4'
      )}>
        <SidebarHeader />
      </BaseSidebarHeader>

      <SidebarContent className="sidebar-scrollbar">
        <SidebarNav role={user?.role} planType={user?.plan_type} />
      </SidebarContent>

      <SidebarFooter className={cn(
        'border-t border-sidebar-border',
        isCollapsed ? 'p-1' : 'p-2'
      )}>
        <SidebarUser user={user} collapsed={isCollapsed} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
