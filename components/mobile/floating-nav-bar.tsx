'use client'

/**
 * Floating Nav Bar - Bottom Dock (Mobile-First Tech Design System)
 *
 * Dock de navegação fixo no bottom:
 * - Glass effect com blur
 * - Safe-area support para iOS
 * - Ícones com labels minimalistas
 * - Estado ativo com cyan dot
 * - Visível apenas em mobile (<768px)
 */

import { Home, MessageCircle, BookOpen, Eye, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/components/ui/sidebar'
import { useDashboardUser } from '@/lib/contexts/dashboard-user-context'

const allNavItems = [
  { icon: Home, href: '/dashboard', label: 'Home', exact: true },
  { icon: BookOpen, href: '/dashboard/biblioteca', label: 'Lib', hiddenForTrial: true },
  { icon: MessageCircle, href: '/dashboard/chat', label: 'Chat', isCenter: true },
  { icon: Eye, href: '/dashboard/odonto-vision', label: 'Vision' },
]

export function FloatingNavBar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { isTrialUser } = useDashboardUser()

  const navItems = allNavItems.filter(item => !(item.hiddenForTrial && isTrialUser))

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href || pathname === href + '/'
    return pathname?.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 md:hidden',
        'px-3 pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className={cn(
        'flex items-center justify-around h-16 px-2',
        'dock-glass',
        'rounded-t-[28px]'
      )}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          const isCenter = 'isCenter' in item && item.isCenter

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'dock-item relative flex flex-col items-center justify-center',
                'rounded-xl',
                isCenter ? 'w-16 h-14 -mt-2' : 'w-14 h-12',
                active && 'dock-item-active'
              )}
            >
              <Icon
                className={cn(
                  'mb-0.5',
                  isCenter ? 'size-7' : 'size-5'
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn(
                'font-medium',
                isCenter ? 'text-[11px]' : 'text-[10px]'
              )}>{item.label}</span>
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-current" />
              )}
            </Link>
          )
        })}

        <button
          onClick={toggleSidebar}
          className="dock-item flex flex-col items-center justify-center w-14 h-12 rounded-xl"
        >
          <Menu className="size-5 mb-0.5" strokeWidth={2} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  )
}
