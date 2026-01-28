'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Loader2, MessageSquare } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
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
import { ChatItem } from '@/components/chat/sidebar-history-item'
import { useHistory, iterateGroups } from '@/lib/chat'

interface SidebarChatsProps {
  userId: string | undefined
}

export function SidebarChats({ userId }: SidebarChatsProps) {
  const { state, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    groupedChats,
    hasMore,
    isLoading,
    isValidating,
    isEmpty,
    loadMore,
    deleteChat,
  } = useHistory({
    mode: 'cursor',
    pageSize: 20,
    enabled: !!userId,
  })

  const handleDelete = async () => {
    const chatToDelete = deleteId
    const isCurrentChat = id === chatToDelete
    setShowDeleteDialog(false)

    if (!chatToDelete) return

    const success = await deleteChat(chatToDelete)
    if (success) {
      toast.success('Conversa excluida')
      if (isCurrentChat) {
        router.replace('/dashboard/chat')
        router.refresh()
      }
    } else {
      toast.error('Erro ao excluir conversa')
    }
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

  if (isEmpty) {
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

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wider">
          Conversas
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {Array.from(iterateGroups(groupedChats)).map(({ key, label, chats }) => (
              <div key={key} className="mb-4">
                <div className="px-2 py-1 text-[11px] font-medium text-[var(--sidebar-text-tertiary)] uppercase tracking-wide">
                  {label}
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
            ))}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && hasMore) {
                loadMore()
              }
            }}
          />

          {hasMore && (
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
