'use client'

import Link from 'next/link'
import { memo } from 'react'
import type { Chat } from '@/lib/db/queries'
import {
  MoreHorizontal,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat
  isActive: boolean
  onDelete: (chatId: string) => void
  setOpenMobile: (open: boolean) => void
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={`/dashboard/chat?id=${chat.id}`}
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
          <span className="truncate">{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Mais opcoes</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false
  }
  return true
})
