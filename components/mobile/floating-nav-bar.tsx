'use client'

/**
 * Floating Navigation Bar - Pill-shaped mobile navigation
 *
 * Menu flutuante em formato de pílula com ícones de navegação:
 * - Sparkles (destaque/AI)
 * - Home
 * - Chat (ativo)
 * - Biblioteca
 * - Vision
 * - Menu hamburguer
 *
 * Visível apenas em mobile (<768px)
 */

import { Sparkles, Home, MessageCircle, BookOpen, Eye, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface FloatingNavBarProps {
  className?: string
}

const navItems = [
  {
    icon: Sparkles,
    href: '/dashboard',
    label: 'AI',
    highlight: true, // Special highlight style
  },
  {
    icon: Home,
    href: '/dashboard',
    label: 'Home',
  },
  {
    icon: MessageCircle,
    href: '/dashboard/chat',
    label: 'Chat',
  },
  {
    icon: BookOpen,
    href: '/dashboard/biblioteca',
    label: 'Biblioteca',
  },
  {
    icon: Eye,
    href: '/dashboard/odonto-vision',
    label: 'Vision',
  },
]

export function FloatingNavBar({ className }: FloatingNavBarProps) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed top-2 left-1/2 -translate-x-1/2 z-50 md:hidden',
        'flex items-center gap-0.5 px-1.5 py-1',
        'bg-white/95 backdrop-blur-xl',
        'rounded-full shadow-lg shadow-black/5',
        'border border-gray-100',
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              'flex items-center justify-center size-8 rounded-full transition-all',
              item.highlight && !active && 'text-primary',
              active && 'bg-primary text-white',
              !active && !item.highlight && 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            aria-label={item.label}
          >
            <Icon className="size-4" />
          </Link>
        )
      })}

      {/* Separator */}
      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="size-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        aria-label="Abrir menu"
      >
        <SlidersHorizontal className="size-4" />
      </Button>
    </nav>
  )
}
