'use client'

import { useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import useSWRInfinite from 'swr/infinite'
import { Loader2, MessageSquare } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Chat } from '@/lib/db/queries'
import { cn } from '@/lib/utils'
import { ChatItem } from '@/components/chat/sidebar-history-item'

type GroupedChats = {
  today: Chat[]
  yesterday: Chat[]
  lastWeek: Chat[]
  lastMonth: Chat[]
  older: Chat[]
}

export type ChatHistory = {
  chats: Chat[]
  hasMore: boolean
}

const PAGE_SIZE = 20

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date()
  const oneWeekAgo = subWeeks(now, 1)
  const oneMonthAgo = subMonths(now, 1)

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt)

      if (isToday(chatDate)) {
        groups.today.push(chat)
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat)
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat)
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat)
      } else {
        groups.older.push(chat)
      }

      return groups
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  )
}

function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory | null
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null
  }

  if (pageIndex === 0) {
    return `/api/history?limit=${PAGE_SIZE}`
  }

  const firstChatFromPage = previousPageData?.chats.at(-1)

  if (!firstChatFromPage) {
    return null
  }

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`
}

interface SidebarChatsProps {
  userId: string | undefined
}

export function SidebarChats({ userId }: SidebarChatsProps) {
  const { state, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  })

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false

  const groupedChats = useMemo(() => {
    if (!paginatedChatHistories) return null
    const chatsFromHistory = paginatedChatHistories.flatMap(
      (paginatedChatHistory) => paginatedChatHistory.chats
    )
    return groupChatsByDate(chatsFromHistory)
  }, [paginatedChatHistories])

  const handleDelete = () => {
    const chatToDelete = deleteId
    const isCurrentChat = id === chatToDelete

    setShowDeleteDialog(false)

    const deletePromise = fetch(`/api/chat?id=${chatToDelete}`, {
      method: 'DELETE',
    })

    toast.promise(deletePromise, {
      loading: 'Excluindo conversa...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter(
                (chat) => chat.id !== chatToDelete
              ),
            }))
          }
        })

        if (isCurrentChat) {
          router.replace('/dashboard/chat')
          router.refresh()
        }

        return 'Conversa excluida'
      },
      error: 'Erro ao excluir conversa',
    })
  }

  // Don't render if collapsed
  if (isCollapsed) {
    return null
  }

  if (!userId) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
          Conversas
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 py-4 text-sm text-[var(--sidebar-text-tertiary)]">
            Faca login para salvar suas conversas
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
          Conversas
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col gap-1 px-2">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                className="flex h-8 items-center gap-2 rounded-md px-2"
                key={item}
              >
                <div
                  className="h-4 flex-1 rounded-md bg-sidebar-accent-foreground/10 animate-pulse"
                  style={{ maxWidth: `${item}%` }}
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
          Conversas
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-[var(--sidebar-text-tertiary)]" />
            <p className="text-sm text-[var(--sidebar-text-tertiary)]">
              Suas conversas aparecerao aqui
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const renderChatGroup = (title: string, chats: Chat[]) => {
    if (chats.length === 0) return null
    return (
      <div key={title} className="mb-4">
        <div className="px-2 py-1 text-[11px] font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wide">
          {title}
        </div>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === id}
            onDelete={(chatId) => {
              setDeleteId(chatId)
              setShowDeleteDialog(true)
            }}
            setOpenMobile={setOpenMobile}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
          Conversas
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {groupedChats && (
              <>
                {renderChatGroup('Hoje', groupedChats.today)}
                {renderChatGroup('Ontem', groupedChats.yesterday)}
                {renderChatGroup('Ultimos 7 dias', groupedChats.lastWeek)}
                {renderChatGroup('Ultimos 30 dias', groupedChats.lastMonth)}
                {renderChatGroup('Mais antigos', groupedChats.older)}
              </>
            )}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1)
              }
            }}
          />

          {!hasReachedEnd && (
            <div className="flex flex-row items-center gap-2 px-2 py-4 text-[var(--sidebar-text-tertiary)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Carregando...</span>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A conversa sera removida
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
