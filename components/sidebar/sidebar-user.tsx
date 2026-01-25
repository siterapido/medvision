'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, Moon, Sun, Bell, ChevronUp } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarUserProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar_url?: string | null
    plan_type?: string | null
    subscription_status?: string | null
  }
  collapsed?: boolean
}

export function SidebarUser({ user, collapsed = false }: SidebarUserProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const [isMounted, setIsMounted] = useState(false)

  // Only render theme-dependent content after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logout realizado com sucesso')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Erro ao fazer logout')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || '?'

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Theme Toggle - Perplexity style */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full flex flex-col items-center justify-center h-auto py-2 px-1 gap-1 text-[var(--sidebar-text-secondary)] hover:text-[var(--sidebar-text-primary)] hover:bg-sidebar-accent"
        >
          {isMounted ? (
            theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="text-[10px] leading-tight">
            {isMounted ? (
              theme === 'dark' ? 'Claro' : 'Escuro'
            ) : (
              'Tema'
            )}
          </span>
        </Button>

        {/* User Avatar with Dropdown - Perplexity style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center justify-center h-auto py-2 px-1 gap-1 hover:bg-sidebar-accent"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] leading-tight text-[var(--sidebar-text-secondary)]">
                Conta
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name || 'Usuario'}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notificacoes">
                <Bell className="mr-2 h-4 w-4" />
                Notificacoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <SidebarMenu>
      {/* Theme Toggle Row */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={toggleTheme}
          className="hover:bg-[var(--sidebar-hover)]"
        >
          {isMounted ? (
            theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--sidebar-text-secondary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--sidebar-text-secondary)]" />
            )
          ) : (
            <Moon className="h-4 w-4 text-[var(--sidebar-text-secondary)]" />
          )}
          <span className="text-[var(--sidebar-text-secondary)]">
            {isMounted ? (
              theme === 'dark' ? 'Modo claro' : 'Modo escuro'
            ) : (
              'Tema'
            )}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* User Profile Row */}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-[var(--sidebar-hover)] data-[state=open]:bg-[var(--sidebar-hover)]"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left">
                <span className="text-sm font-medium text-[var(--sidebar-text-primary)] truncate">
                  {user?.name || 'Usuario'}
                </span>
                <span className="text-xs text-[var(--sidebar-text-tertiary)] truncate">
                  {user?.plan_type === 'premium' ? 'Premium' : 'Plano Gratuito'}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-[var(--sidebar-text-tertiary)]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
          >
            <div className="flex items-center gap-2 p-2 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name || 'Usuario'}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notificacoes">
                <Bell className="mr-2 h-4 w-4" />
                Notificacoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
