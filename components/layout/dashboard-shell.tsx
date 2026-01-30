'use client'

/**
 * Dashboard Shell - Client wrapper for dashboard pages
 *
 * Mobile-First Tech Design System:
 * - bg-void background
 * - Bottom dock navigation with safe-area
 * - Padding bottom for dock on non-chat pages
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

  // Detecta páginas que precisam de altura total (chat, biblioteca)
  const isChat = pathname?.includes('/chat')
  const needsFullHeight = isChat || pathname?.includes('/biblioteca')

  return (
    <div
      className={cn(
        'flex flex-col bg-void',
        needsFullHeight ? 'h-full overflow-hidden' : 'min-h-screen',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col flex-1',
          needsFullHeight && 'min-h-0',
          // Padding para dock no mobile (exceto chat que gerencia próprio espaço)
          isMobile && !isChat && 'pb-[calc(64px+env(safe-area-inset-bottom))]'
        )}
      >
        {children}
      </div>

      {isMobile && <FloatingNavBar />}
    </div>
  )
}
