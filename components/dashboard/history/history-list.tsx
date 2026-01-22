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
    const router = useRouter()

    useEffect(() => {
        loadSessions()
    }, [])

    async function loadSessions() {
        try {
            setIsLoading(true)
            const data = await getUserSessions()
            // Fix types if needed, treating data as AgentSession[]
            setSessions(data as any[])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar histórico")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.preventDefault() // prevent navigation
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

    const filtered = sessions.filter(s =>
        (s.title || 'Nova Conversa').toLowerCase().includes(filter.toLowerCase())
    )

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
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar nas conversas..."
                    className="w-full bg-card border border-border/50 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(session => (
                    <Link
                        key={session.id}
                        href={`/dashboard/chat?id=${session.id}`}
                        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                    {session.agent_type || 'OdontoGPT'}
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
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
                ))}
            </div>
        </div>
    )
}
