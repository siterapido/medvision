'use client'

import { useRouter } from 'next/navigation'
import { Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
    const { openMobile, isMobile } = useSidebar()
    const menuAberto = isMobile && openMobile

    return (
        <header
            className={cn(
                'sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-200',
                menuAberto ? 'border-violet-500/55' : 'border-border'
            )}
        >
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard')}
                    className="h-8 w-8 rounded-full lg:hidden"
                >
                    <User className="h-4 w-4" />
                    <span className="sr-only">Perfil</span>
                </Button>
                <Separator
                    orientation="vertical"
                    className={cn(
                        'mr-2 h-4 lg:hidden transition-colors',
                        menuAberto ? 'bg-violet-500/45' : undefined
                    )}
                />

                {/* Title or Breadcrumb */}
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="hidden sm:inline-block text-muted-foreground">MedVision</span>
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
                                router.push('/dashboard/odonto-vision')
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
