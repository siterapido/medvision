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
    plan_type?: string | null
    subscription_status?: string | null
  }
  collapsed?: boolean
}

export function UserProfile({ user, collapsed }: UserProfileProps) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario'
  const isPro = user?.plan_type?.toLowerCase() === 'pro' || user?.plan_type?.toLowerCase() === 'premium'

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
            'w-full flex items-center rounded-md',
            'text-sidebar-muted hover:text-sidebar-foreground',
            'hover:bg-sidebar-accent/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar',
            collapsed
              ? 'flex-col justify-center gap-1.5 p-2 h-auto'
              : 'flex-row gap-3 px-3 py-2'
          )}
        >
          {/* Avatar & Badge Container */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative">
              {user?.avatar_url ? (
                <div className="p-0.5 rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors">
                  <img
                    src={user.avatar_url}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-sidebar-border flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{initials}</span>
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar" />
            </div>

            {/* Pro Badge (Real data) */}
            {isPro && (
              <div className="mt-[-6px] z-10 bg-[#00A3A3] text-white text-[8px] font-bold px-1 rounded-sm border border-sidebar uppercase tracking-tight">
                pro
              </div>
            )}
          </div>

          {/* User info */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-0.5">
              <ChevronDown className="h-3 w-3 text-sidebar-muted group-hover:text-sidebar-foreground transition-colors" />
              <span className="text-[10px] font-medium text-center leading-none text-sidebar-muted group-hover:text-sidebar-foreground">
                Conta
              </span>
            </div>
          ) : (
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
