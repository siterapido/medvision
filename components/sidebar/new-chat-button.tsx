'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NewChatButtonProps {
  collapsed?: boolean
}

export function NewChatButton({ collapsed = false }: NewChatButtonProps) {
  return (
    <Button
      asChild
      variant="default"
      className={cn(
        'w-full font-medium',
        'bg-primary hover:bg-primary/90',
        'text-primary-foreground',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'sidebar-glow-intense',
        collapsed
          ? 'flex-col h-auto py-2 px-1 gap-1'
          : 'justify-start gap-2'
      )}
    >
      <Link href="/dashboard/chat">
        <Plus className={cn(collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
        <span className={cn(
          collapsed && 'text-[10px] leading-tight'
        )}>
          {collapsed ? 'Novo' : 'Novo Chat'}
        </span>
      </Link>
    </Button>
  )
}
