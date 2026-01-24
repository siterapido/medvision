'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
// import { AgentSwitcher } from './agent-switcher' // Optional, can enable if needed in header

interface ChatHeaderProps {
    selectedAgentId?: string
    onAgentChange?: (id: string) => void
}

export function ChatHeader({
    selectedAgentId,
    onAgentChange,
}: ChatHeaderProps) {
    const router = useRouter()
    const { isMobile } = useSidebar()

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                {/* Title or Breadcrumb */}
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="hidden sm:inline-block text-muted-foreground">Odonto GPT</span>
                    <span className="hidden sm:inline-block text-muted-foreground">/</span>
                    <span className="text-foreground">Chat</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {/* Agent Switcher could go here if we remove it from input */}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                router.push('/dashboard/chat')
                                router.refresh()
                            }}
                            className="h-8 w-8"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Nova Conversa</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end">Nova Conversa</TooltipContent>
                </Tooltip>
            </div>
        </header>
    )
}
