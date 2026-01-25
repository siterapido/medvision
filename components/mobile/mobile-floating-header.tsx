'use client'

/**
 * Mobile Floating Header - Perplexity-style
 *
 * Header fixo no topo para mobile com:
 * - Botao menu (sidebar toggle)
 * - Logo compacto centralizado
 * - Avatar/settings
 *
 * Visivel apenas em mobile (<768px)
 */

import { Menu, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MobileFloatingHeaderProps {
  userName?: string
  userImage?: string
  className?: string
}

export function MobileFloatingHeader({
  userName,
  userImage,
  className,
}: MobileFloatingHeaderProps) {
  const { toggleSidebar } = useSidebar()

  // Get initials from name
  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 md:hidden',
        'h-[52px] pt-[env(safe-area-inset-top)]',
        'bg-background/95 backdrop-blur-xl',
        'border-b border-border/50',
        'flex items-center justify-between px-3',
        className
      )}
    >
      {/* Left: Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Center: Logo */}
      <Link
        href="/dashboard"
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5"
      >
        <Sparkles className="size-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Odonto<span className="text-primary">GPT</span>
        </span>
      </Link>

      {/* Right: User avatar or settings */}
      <div className="flex items-center gap-1">
        <Link href="/dashboard/configuracoes">
          <Avatar className="size-8 cursor-pointer ring-2 ring-background hover:ring-primary/20 transition-all">
            {userImage ? (
              <AvatarImage src={userImage} alt={userName || 'Usuario'} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
