"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useState } from "react"

const mockChats = [
  { id: "1", title: "Tratamento de canal", date: "Hoje" },
  { id: "2", title: "Clareamento dental", date: "Hoje" },
  { id: "3", title: "Implante dentário", date: "Ontem" },
  { id: "4", title: "Ortodontia invisível", date: "Ontem" },
  { id: "5", title: "Extração de siso", date: "Há 2 dias" },
  { id: "6", title: "Prótese dentária", date: "Há 3 dias" },
  { id: "7", title: "Periodontia", date: "Há 4 dias" },
]

export function ChatSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleNewChat = () => {
    router.push("/chat")
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex gap-2 mb-3">
          <Link
            href="/chat/cursos"
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-center",
              pathname?.startsWith("/chat/cursos")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            Cursos
          </Link>
          <Link
            href="/chat/perfil"
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-center",
              pathname?.startsWith("/chat/perfil")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            Perfil
          </Link>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mockChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={cn(
                "block px-3 py-2 text-sm rounded-lg transition-colors group",
                pathname === `/chat/${chat.id}`
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="truncate flex-1">{chat.title}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{chat.date}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <span className="flex-1 text-left truncate text-xs">{user.email}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
