"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, MessageSquare, Image, Calendar, Loader2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { fetchSessions, deleteSession, type AgentSession } from "@/lib/ai/session-cache"

type ChatHistoryClientProps = {
  userId: string
}

export function ChatHistoryClient({ userId }: ChatHistoryClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadSessions = async () => {
    setLoading(true)
    const { sessions: data } = await fetchSessions({ forceRefresh: true })
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return

    setDeleting(sessionId)
    const success = await deleteSession(sessionId)

    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    }

    setDeleting(null)
  }

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case "image-analysis":
        return <Image className="w-4 h-4" />
      case "qa":
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getAgentLabel = (agentType: string) => {
    switch (agentType) {
      case "image-analysis":
        return "Análise de Imagem"
      case "qa":
        return "Perguntas e Respostas"
      case "orchestrated":
        return "Multi-agente"
      default:
        return agentType
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Histórico de Conversas
                </h1>
                <p className="text-sm text-slate-400">
                  {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
                </p>
              </div>
            </div>

            <button
              onClick={loadSessions}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-slate-400">Carregando histórico...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 flex items-center justify-center mx-auto rounded-full bg-slate-800/50">
                <MessageSquare className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma conversa ainda
                </h3>
                <p className="text-slate-400">
                  Comece a conversar com o Odonto GPT para ver seu histórico aqui.
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all"
              >
                Começar Conversa
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/80 text-primary">
                        {getAgentIcon(session.agentType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {getAgentLabel(session.agentType)}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {session.messageCount || 0} {session.messageCount === 1 ? "mensagem" : "mensagens"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/50 text-xs font-medium">
                        {session.status === "active" ? "Ativo" : session.status === "completed" ? "Concluído" : "Erro"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/chat?session=${session.id}`)}
                      className="px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/50 text-white text-sm font-medium transition-all"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deleting === session.id}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {deleting === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
