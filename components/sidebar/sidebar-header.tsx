'use client'

import Link from 'next/link'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function SidebarHeader() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div className={cn(
      'flex items-center',
      isCollapsed ? 'flex-col gap-2' : 'justify-between'
    )}>
      <Link
        href="/dashboard/odonto-vision"
        className="relative flex items-center justify-center group"
      >
        <Logo
          width={isCollapsed ? 32 : 120}
          height={isCollapsed ? 32 : 32}
          variant="auto"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
      </Link>

      {/* Toggle button - Perplexity style */}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Expandir sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Expandir menu
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <PanelLeftClose className="h-4 w-4" />
          <span className="sr-only">Recolher sidebar</span>
        </Button>
      )}
    </div>
  )
}
