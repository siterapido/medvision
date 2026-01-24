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
import { SidebarChats } from './sidebar-chats'
import { SidebarSearch } from './sidebar-search'
import { SidebarUser } from './sidebar-user'
import { NewChatButton } from './new-chat-button'
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
  const pathname = usePathname()
  const isOnChat = pathname?.startsWith('/dashboard/chat')
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'border-r border-sidebar-border',
        'bg-[var(--sidebar-bg)]'
      )}
    >
      {/* Header with Logo - Perplexity style centered when collapsed */}
      <BaseSidebarHeader className={cn(
        isCollapsed ? 'p-2' : 'p-4'
      )}>
        <SidebarHeader />
      </BaseSidebarHeader>

      {/* New Chat CTA */}
      <div className={cn(
        'pb-2',
        isCollapsed ? 'px-1' : 'px-3'
      )}>
        <NewChatButton collapsed={isCollapsed} />
      </div>

      {/* Search (only visible when on chat routes and expanded) */}
      {isOnChat && !isCollapsed && (
        <div className="px-3 pb-2">
          <SidebarSearch />
        </div>
      )}

      <SidebarContent className="sidebar-scrollbar">
        {/* Navigation Section */}
        <SidebarNav role={user?.role} />

        {/* Chat History Section (visible on chat routes, only when expanded) */}
        {isOnChat && !isCollapsed && (
          <SidebarChats userId={user?.id} />
        )}
      </SidebarContent>

      {/* Footer with User Profile - Perplexity style */}
      <SidebarFooter className={cn(
        'border-t border-sidebar-border',
        isCollapsed ? 'p-1' : 'p-2'
      )}>
        <SidebarUser user={user} collapsed={isCollapsed} />
      </SidebarFooter>

      {/* Rail for resizing */}
      <SidebarRail />
    </Sidebar>
  )
}
