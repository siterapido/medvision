'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface UserProfileProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
  collapsed?: boolean
}

export function UserProfile({ user, collapsed }: UserProfileProps) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md',
            'text-sidebar-muted hover:text-sidebar-foreground',
            'hover:bg-sidebar-accent/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar',
            collapsed && 'justify-center px-2'
          )}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover border border-sidebar-border"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-sidebar-border flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{initials}</span>
              </div>
            )}
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar" />
          </div>

          {/* User info */}
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-sidebar-muted truncate">{user.email}</p>
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-muted" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? 'center' : 'end'}
        side={collapsed ? 'right' : 'top'}
        className="w-56"
      >
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium">{displayName}</p>
          {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
        </div>

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracoes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Configuracoes</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <form action="/auth/signout" method="POST">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
