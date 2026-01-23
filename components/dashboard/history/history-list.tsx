'use client'

import { useEffect, useState } from 'react'
import { getUserSessions, deleteSession } from '@/app/actions/chat'
import { AgentSession } from '@/lib/ai/chat-service'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, Trash2, Calendar, ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function HistoryList() {
    const [sessions, setSessions] = useState<AgentSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [agentFilter, setAgentFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const router = useRouter()

    useEffect(() => {
        loadSessions()
    }, [])

    async function loadSessions() {
        try {
            setIsLoading(true)
            const data = await getUserSessions()
            setSessions(data as any[])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar histórico")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm("Tem certeza que deseja apagar esta conversa?")) return

        try {
            await deleteSession(id)
            setSessions(prev => prev.filter(s => s.id !== id))
            toast.success("Conversa removida")
        } catch (error) {
            toast.error("Erro ao remover conversa")
        }
    }

    const filtered = sessions.filter(s => {
        const matchesSearch = (s.title || 'Nova Conversa').toLowerCase().includes(filter.toLowerCase())
        const matchesAgent = agentFilter === 'all' || s.agent_type === agentFilter

        let matchesDate = true
        if (dateFilter !== 'all') {
            const date = new Date(s.updated_at || s.created_at)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - date.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (dateFilter === 'today') matchesDate = diffDays <= 1
            if (dateFilter === '7days') matchesDate = diffDays <= 7
            if (dateFilter === '30days') matchesDate = diffDays <= 30
        }

        return matchesSearch && matchesAgent && matchesDate
    })

    const uniqueAgents = Array.from(new Set(sessions.map(s => s.agent_type))).filter(Boolean)

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-40 rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        )
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-muted/30">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium">Nenhuma conversa encontrada</h3>
                <p className="text-muted-foreground">Inicie um novo chat para começar seu histórico.</p>
                <Link href="/dashboard/chat" className="px-6 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
                    Iniciar Chat
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-2xl border border-border/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar nas conversas..."
                        className="w-full bg-background border border-border/50 rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm text-sm"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <select
                        className="px-3 py-2 rounded-xl bg-background border border-border/50 text-sm outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer min-w-[140px]"
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                    >
                        <option value="all">Todos os Agentes</option>
                        {uniqueAgents.map(agent => (
                            <option key={agent} value={agent}>{agent || 'OdontoGPT'}</option>
                        ))}
                    </select>

                    <select
                        className="px-3 py-2 rounded-xl bg-background border border-border/50 text-sm outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer min-w-[140px]"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">Todas as datas</option>
                        <option value="today">Hoje</option>
                        <option value="7days">Últimos 7 dias</option>
                        <option value="30days">Últimos 30 dias</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Nenhuma conversa corresponde aos filtros.
                    </div>
                ) : (
                    filtered.map((session, index) => (
                        <Link
                            key={session.id}
                            href={`/dashboard/chat?id=${session.id}`}
                            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-in fade-in zoom-in-50 fill-mode-both"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        {session.agent_type || 'OdontoGPT'}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, session.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-md"
                                        title="Excluir conversa"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="font-heading font-medium text-lg text-foreground line-clamp-2 leading-tight">
                                    {session.title || 'Nova Conversa'}
                                </h3>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {formatDistanceToNow(new Date(session.updated_at || session.created_at), {
                                            addSuffix: true,
                                            locale: ptBR
                                        })}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
