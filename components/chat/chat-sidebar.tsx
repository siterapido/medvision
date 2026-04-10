'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, BotMessageSquare } from 'lucide-react'
import { SidebarHistory } from './sidebar-history'
import { useHistoryRevalidation } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ChatSidebarProps {
  userId?: string
  userName?: string
  userImage?: string
}

export function ChatSidebar({ userId, userName, userImage }: ChatSidebarProps) {
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const { revalidateHistory } = useHistoryRevalidation()
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)

  const handleDeleteAll = () => {
    const deletePromise = fetch('/api/history', {
      method: 'DELETE',
    })

    toast.promise(deletePromise, {
      loading: 'Excluindo todas as conversas...',
      success: () => {
        revalidateHistory()
        setShowDeleteAllDialog(false)
        router.replace('/dashboard/chat')
        router.refresh()
        return 'Todas as conversas foram excluidas'
      },
      error: 'Erro ao excluir conversas',
    })
  }

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/dashboard/chat"
                onClick={() => {
                  setOpenMobile(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <BotMessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="cursor-pointer font-semibold text-lg hover:text-primary transition-colors">
                    MedVision
                  </span>
                </div>
              </Link>
              <div className="flex flex-row gap-1">
                {userId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2"
                        onClick={() => setShowDeleteAllDialog(true)}
                        type="button"
                        variant="ghost"
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      Excluir todas as conversas
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false)
                        router.push('/dashboard/chat')
                        router.refresh()
                      }}
                      type="button"
                      variant="ghost"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    Nova conversa
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarHistory userId={userId} />
        </SidebarContent>
        <SidebarFooter>
          {userId && (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userImage} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {userName || 'Usuario'}
                </span>
                <Link
                  href="/dashboard"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Voltar ao Dashboard
                </Link>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todas as conversas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todas as suas conversas serao
              removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
