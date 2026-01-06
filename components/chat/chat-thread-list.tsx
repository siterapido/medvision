"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getChatThreads, removeChatThread } from "@/app/actions/chat"
import type { ChatThread } from "@/lib/chat"

type ChatThreadListProps = {
  selectedThreadId: string | null
  onSelectThread: (threadId: string | null) => void
  onNewThread: () => void
}

export function ChatThreadList({
  selectedThreadId,
  onSelectThread,
  onNewThread,
}: ChatThreadListProps) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadThreads = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getChatThreads()
      if (result.success && result.data) {
        setThreads(result.data)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      console.error("[chat-thread-list] Erro ao carregar threads:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar conversas"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThreads()
  }, [])

  const handleDelete = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("Tem certeza que deseja excluir esta conversa?")) {
      return
    }

    setDeletingId(threadId)
    try {
      const result = await removeChatThread(threadId)
      if (result.success) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId))
        if (selectedThreadId === threadId) {
          onSelectThread(null)
        }
      }
    } catch (error) {
      console.error("[chat-thread-list] Erro ao deletar thread:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir conversa. Tente novamente."
      alert(errorMessage)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border-r border-slate-800/50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800/50">
        <Button
          onClick={onNewThread}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
            <p className="text-sm font-medium text-slate-300 mb-2">Erro ao carregar conversas</p>
            <p className="text-xs text-slate-400 mb-4 px-4">{error}</p>
            <Button
              onClick={loadThreads}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Tentar novamente
            </Button>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 mb-1">Nenhuma conversa ainda</p>
            <p className="text-xs text-slate-500">Comece uma nova conversa acima</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  "hover:bg-slate-800/50",
                  selectedThreadId === thread.id
                    ? "bg-slate-800 border border-cyan-500/30"
                    : "border border-transparent"
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {thread.title || "Nova conversa"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(thread.last_message_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(thread.id, e)}
                  disabled={deletingId === thread.id}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    "flex items-center justify-center",
                    "text-slate-400 hover:text-red-400 hover:bg-red-500/10",
                    deletingId === thread.id && "opacity-100"
                  )}
                  title="Excluir conversa"
                >
                  {deletingId === thread.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

