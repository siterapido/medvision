'use client'

import Link from 'next/link'
import { memo, useState } from 'react'
import type { Chat } from '@/lib/db/queries'
import {
  MoreHorizontal,
  Trash2,
  MessageSquare,
  User,
  Bot,
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

interface MessagePreview {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

interface ChatPreview {
  id: string
  title: string
  agentType: string
  createdAt: string
  messages: MessagePreview[]
}

const fetcher = async (url: string): Promise<ChatPreview> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

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
  const [isHovered, setIsHovered] = useState(false)

  // Prefetch preview on hover
  const { data: preview } = useSWR<ChatPreview>(
    isHovered ? `/api/history/${chat.id}/preview` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  )

  return (
    <SidebarMenuItem>
      <HoverCard openDelay={400} closeDelay={100}>
        <HoverCardTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'transition-all duration-150',
              isActive && 'border-l-2 border-[var(--brand)] bg-[var(--brand-glow)]'
            )}
          >
            <Link
              href={`/dashboard/chat?id=${chat.id}`}
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">{chat.title}</span>
              {chat.agentType && chat.agentType !== 'qa' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-200)] text-[var(--text-muted)] shrink-0">
                  {chat.agentType}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
        </HoverCardTrigger>

        <HoverCardContent
          side="right"
          align="start"
          className={cn(
            'w-72 p-3',
            'bg-[var(--surface-300)] border-[var(--border-overlay)]',
            'shadow-lg'
          )}
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                {preview?.title || chat.title}
              </h4>
              {preview?.agentType && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  {preview.agentType}
                </span>
              )}
            </div>

            {preview?.messages && preview.messages.length > 0 ? (
              <div className="space-y-2 border-t border-[var(--border-subtle)] pt-2">
                {preview.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 text-xs">
                    <div className="shrink-0 mt-0.5">
                      {msg.role === 'user' ? (
                        <User className="h-3 w-3 text-[var(--text-tertiary)]" />
                      ) : (
                        <Bot className="h-3 w-3 text-[var(--brand)]" />
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)] line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic">
                Carregando preview...
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

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
  if (prevProps.chat.id !== nextProps.chat.id) {
    return false
  }
  if (prevProps.chat.title !== nextProps.chat.title) {
    return false
  }
  return true
})
