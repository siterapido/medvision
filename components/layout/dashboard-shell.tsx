'use client'

/**
 * Dashboard Shell - Client wrapper for dashboard pages
 *
 * Includes the FloatingNavBar for mobile navigation
 * across all dashboard pages.
 */

import { FloatingNavBar } from '@/components/mobile/floating-nav-bar'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()

  // Detecta se está em uma página que precisa de altura total (chat, biblioteca com visualizador, etc)
  const needsFullHeight = pathname?.includes('/chat') || pathname?.includes('/biblioteca')

  return (
    <div className={cn(
      'flex flex-col',
      needsFullHeight ? 'h-full overflow-hidden' : 'min-h-screen overflow-y-auto',
      className
    )}>
      {/* Mobile Floating Nav Bar */}
      {isMobile && <FloatingNavBar />}

      {/* Main content with padding for floating nav on mobile */}
      <div className={cn(
        'flex flex-col',
        isMobile && 'pt-12',
        needsFullHeight ? 'h-full flex-1' : 'flex-1',
      )}>
        {children}
      </div>
    </div>
  )
}
