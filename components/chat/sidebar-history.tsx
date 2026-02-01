'use client'

import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar'
import { Loader2 } from 'lucide-react'
import { ChatItem } from './sidebar-history-item'
import { useHistory, groupChatsByDate } from '@/lib/chat'

export function SidebarHistory({ userId }: { userId: string | undefined }) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  // Extract chat id from pathname (format: /dashboard/chat/[id])
  const id = pathname.startsWith('/dashboard/chat/')
    ? pathname.split('/dashboard/chat/')[1]?.split('/')[0] || null
    : null

  const {
    chats,
    isLoading,
    loadMore,
    hasMore,
    isValidating,
    deleteChat
  } = useHistory()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    const isCurrentChat = id === deleteId
    setShowDeleteDialog(false)

    await deleteChat(deleteId)

    if (isCurrentChat) {
      router.replace('/dashboard/chat')
      router.refresh()
    }
    setDeleteId(null)
  }

  if (!userId) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Faca login para salvar suas conversas
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (isLoading && chats.length === 0) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">Hoje</div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                className="flex h-8 items-center gap-2 rounded-md px-2"
                key={item}
              >
                <div
                  className="h-4 flex-1 rounded-md bg-sidebar-accent-foreground/10"
                  style={{ maxWidth: `${item}%` }}
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  if (chats.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Suas conversas aparecerao aqui
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const groupedChats = groupChatsByDate(chats)

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="flex flex-col gap-6">
              {groupedChats.today.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Hoje
                  </div>
                  {groupedChats.today.map((chat) => (
                    <ChatItem
                      chat={chat}
                      isActive={chat.id === id}
                      key={chat.id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId)
                        setShowDeleteDialog(true)
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedChats.yesterday.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Ontem
                  </div>
                  {groupedChats.yesterday.map((chat) => (
                    <ChatItem
                      chat={chat}
                      isActive={chat.id === id}
                      key={chat.id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId)
                        setShowDeleteDialog(true)
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedChats.lastWeek.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Ultimos 7 dias
                  </div>
                  {groupedChats.lastWeek.map((chat) => (
                    <ChatItem
                      chat={chat}
                      isActive={chat.id === id}
                      key={chat.id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId)
                        setShowDeleteDialog(true)
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedChats.lastMonth.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Ultimos 30 dias
                  </div>
                  {groupedChats.lastMonth.map((chat) => (
                    <ChatItem
                      chat={chat}
                      isActive={chat.id === id}
                      key={chat.id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId)
                        setShowDeleteDialog(true)
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedChats.older.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Mais antigos
                  </div>
                  {groupedChats.older.map((chat) => (
                    <ChatItem
                      chat={chat}
                      isActive={chat.id === id}
                      key={chat.id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId)
                        setShowDeleteDialog(true)
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && hasMore) {
                loadMore()
              }
            }}
          />

          {!hasMore ? (
            <div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
              Fim do historico
            </div>
          ) : (
            <div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div>Carregando...</div>
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
