'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, ChevronUp, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isTrialExpired, getRemainingTrialDays } from '@/lib/trial'
import { toast } from 'sonner'
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

interface SidebarUserProps {
  user?: {
    name?: string | null
    email?: string | null
    avatar_url?: string | null
    plan_type?: string | null
    subscription_status?: string | null
    trial_ends_at?: string | null
  }
  collapsed?: boolean
}

export function SidebarUser({ user, collapsed = false }: SidebarUserProps) {
  const router = useRouter()
  const supabase = createClient()

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

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || '?'

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* User Avatar with Dropdown - Perplexity style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex flex-col items-center justify-center h-auto py-2 px-1 gap-1 hover:bg-sidebar-accent"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] leading-tight text-muted-foreground">
                Conta
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
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
              <Link href="/dashboard/perfil">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
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

      {/* User Profile Row */}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || 'Usuario'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.plan_type === 'pro'
                    ? 'Plano Pro'
                    : user?.plan_type === 'premium'
                      ? 'Premium Pro'
                      : user?.plan_type === 'basic'
                        ? 'Plano Basic'
                        : !isTrialExpired(user?.trial_ends_at)
                          ? `${getRemainingTrialDays(user?.trial_ends_at)} dias de teste`
                          : 'Plano Basic'}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
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
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
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
              <Link href="/dashboard/perfil">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
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
