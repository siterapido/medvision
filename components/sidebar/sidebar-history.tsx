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
import { useHistory, iterateGroups } from '@/lib/chat'
import { cn } from '@/lib/utils'

export function SidebarHistory() {
    const pathname = usePathname()
    const { state, isMobile, setOpenMobile } = useSidebar()
    const isCollapsed = state === 'collapsed'

    const { groupedChats, isLoading, isEmpty } = useHistory({
        pageSize: 20,
        enabled: true
    })

    // Completely hide when collapsed
    if (isCollapsed) return null

    if (isLoading) {
        return (
            <SidebarGroup className="mt-2">
                <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
                    Histórico
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <div className="space-y-2 px-2 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 w-full bg-sidebar-accent/10 rounded animate-pulse" />
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        )
    }

    if (isEmpty) {
        return null
    }

    return (
        <SidebarGroup className="mt-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
                Histórico
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {Array.from(iterateGroups(groupedChats)).map(({ key, label, chats }) => (
                        <div key={key} className="mt-4 first:mt-0">
                            <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-[var(--sidebar-text-tertiary)] tracking-wider">
                                {label}
                            </div>
                            {chats.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === `/dashboard/chat/${chat.id}`}
                                        className="h-auto py-2 group-data-[collapsible=icon]:!p-2"
                                    >
                                        <Link
                                            href={`/dashboard/chat/${chat.id}`}
                                            onClick={() => isMobile && setOpenMobile(false)}
                                        >
                                            <span className="truncate text-sm">{chat.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </div>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
