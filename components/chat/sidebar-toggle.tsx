'use client'

import type { ComponentProps } from 'react'
import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar, isMobile, openMobile } = useSidebar()
  const menuAberto = isMobile && openMobile

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn(
            'h-8 px-2 transition-colors md:h-fit md:px-2',
            menuAberto &&
              'border-violet-500/60 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15 hover:text-violet-200 [&_svg]:text-violet-300',
            className
          )}
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
        >
          <PanelLeft size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start" className="hidden md:block">
        Alternar barra lateral
      </TooltipContent>
    </Tooltip>
  )
}
