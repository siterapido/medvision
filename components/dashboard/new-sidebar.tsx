"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import {
  BotIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  UserRound,
  FileText,
  Microscope,
  ClipboardList,
  PenTool,
  Image as ImageIcon,
  Plus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

export const dashboardNavigation = [
  { name: "Nova Busca", href: "/dashboard", icon: Search, exact: true },
  { name: "Odonto GPT", href: "/dashboard/chat", icon: MessageSquarePlus },
  { name: "Pesquisas", href: "/dashboard/pesquisas", icon: Microscope },
  { name: "Questionários", href: "/dashboard/questionarios", icon: ClipboardList },
  { name: "Escritor", href: "/dashboard/escritor", icon: PenTool },
  { name: "Imagens", href: "/dashboard/imagens", icon: ImageIcon },
  { name: "Resumos", href: "/dashboard/resumos", icon: FileText },
  { name: "Cursos", href: "/dashboard/cursos", icon: GraduationCap },
  { name: "Materiais", href: "/dashboard/materiais", icon: BookOpen },
]

interface NewSidebarProps {
  isCollapsed: boolean
  toggleCollapse: () => void
  onLogout?: () => void
}

export function NewSidebar({ isCollapsed, toggleCollapse, onLogout }: NewSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar/50 backdrop-blur-xl transition-all duration-300 ease-in-out h-screen sticky top-0 z-50",
          isCollapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          {!isCollapsed && (
             <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
               <Logo width={100} height={24} />
             </Link>
          )}
          {isCollapsed && (
             <Link href="/dashboard" className="mx-auto transition-opacity hover:opacity-80">
               <Logo width={32} height={32} iconOnly />
             </Link>
          )}
        </div>

        {/* Botão Novo Chat / Busca (Perplexity Style) */}
        <div className="p-3">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 rounded-full border-border/60 bg-background/50 hover:bg-background/80 hover:border-border transition-all shadow-sm",
                isCollapsed ? "px-0 justify-center h-10 w-10 mx-auto" : "h-10 px-4"
              )}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="text-sm font-medium">Nova Busca</span>}
            </Button>
          </Link>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto custom-scrollbar">
          {dashboardNavigation.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href) && item.href !== "/dashboard"

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      isCollapsed && "justify-center px-0 py-3"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-2 border-t border-border/50 flex flex-col gap-1">
           <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/perfil"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <UserRound className="h-5 w-5" />
                {!isCollapsed && <span>Perfil</span>}
              </Link>
            </TooltipTrigger>
             {isCollapsed && <TooltipContent side="right">Perfil</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/assinatura"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Sparkles className="h-5 w-5" />
                {!isCollapsed && <span>Assinatura</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Assinatura</TooltipContent>}
          </Tooltip>
          
           <div className="my-1 border-t border-border/30" />

           <button
             onClick={toggleCollapse}
             className={cn(
               "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors w-full",
               isCollapsed && "justify-center px-0"
             )}
           >
             {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
             {!isCollapsed && <span>Colapsar</span>}
           </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
