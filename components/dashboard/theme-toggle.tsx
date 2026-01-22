'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="h-5 w-5 rounded-full bg-sidebar-accent animate-pulse" />
        {!collapsed && <div className="h-4 w-16 rounded bg-sidebar-accent animate-pulse" />}
      </div>
    )
  }

  const currentIcon =
    resolvedTheme === 'dark' ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    )

  const themeLabel = theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 rounded-md text-sm font-medium',
            'text-sidebar-muted hover:text-sidebar-foreground',
            'hover:bg-sidebar-accent/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
            collapsed ? 'p-2 justify-center' : 'px-3 py-2 w-full'
          )}
          title={collapsed ? `Tema: ${themeLabel}` : undefined}
        >
          <span className="shrink-0">{currentIcon}</span>
          {!collapsed && (
            <span className="whitespace-nowrap">Tema: {themeLabel}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? 'center' : 'start'}
        side={collapsed ? 'right' : 'top'}
        className="w-40"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn('flex items-center gap-2', theme === 'light' && 'bg-accent')}
        >
          <Sun className="h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn('flex items-center gap-2', theme === 'dark' && 'bg-accent')}
        >
          <Moon className="h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn('flex items-center gap-2', theme === 'system' && 'bg-accent')}
        >
          <Monitor className="h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
