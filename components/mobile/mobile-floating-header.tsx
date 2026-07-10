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

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { MED_VISION_HREF } from '@/lib/constants/navigation'

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
  const { toggleSidebar, isMobile, openMobile } = useSidebar()
  const menuAberto = isMobile && openMobile

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
        'bg-background',
        'border-b border-rule transition-colors duration-200',
        menuAberto ? 'border-signal/30' : undefined,
        'flex items-center justify-between px-3',
        className
      )}
    >
      {/* Left: Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          'size-9 rounded-lg border border-transparent transition-colors',
          menuAberto
            ? 'border-signal/40 bg-signal/8 text-signal hover:bg-signal/12 hover:text-signal'
            : 'text-muted-foreground hover:border-signal/25 hover:text-foreground'
        )}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Center: Logo */}
      <Link
        href={MED_VISION_HREF}
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center max-w-[40%] overflow-hidden"
        aria-label="MedVision"
      >
        <Logo width={100} height={24} variant="auto" className="text-ink" />
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
