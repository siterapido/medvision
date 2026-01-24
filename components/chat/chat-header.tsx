'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo } from 'react'
import { SidebarToggle } from '@/components/chat/sidebar-toggle'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function PureChatHeader() {
  const router = useRouter()
  const { open } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarToggle />

      {!open && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="ml-auto h-8 px-2 md:ml-0 md:h-fit md:px-2"
              onClick={() => {
                router.push('/dashboard/chat')
                router.refresh()
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Nova conversa</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent align="end">Nova conversa</TooltipContent>
        </Tooltip>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    </header>
  )
}

export const ChatHeader = memo(PureChatHeader)
