'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, Trash2, Calendar, ArrowRight, Search, Clock, Bot, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentUI } from '@/lib/ai/agents/ui-config'
import { useHistory, groupChatsByDate } from '@/lib/chat'

export function HistoryList() {
    const { chats, isLoading, deleteChat, hasMore, loadMore, isValidating } = useHistory()
    const [searchFilter, setSearchFilter] = useState('')
    const [agentFilter, setAgentFilter] = useState<string>('all')

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm("Tem certeza que deseja apagar esta conversa?")) return
        await deleteChat(id)
    }

    // Filter sessions
    const filteredSessions = chats.filter(s => {
        const matchesSearch = (s.title || 'Nova Conversa').toLowerCase().includes(searchFilter.toLowerCase())
        const matchesAgent = agentFilter === 'all' || s.agentType === agentFilter
        return matchesSearch && matchesAgent
    })

    // Group sessions by date using shared utility
    const groupedChatsStruct = groupChatsByDate(filteredSessions)

    // Map the struct to the array format expected by the render loop if we want to keep order control
    // Or just iterate over the keys. The shared utility returns specific keys.
    const groupedSessions = {
        'Hoje': groupedChatsStruct.today,
        'Ontem': groupedChatsStruct.yesterday,
        'Esta Semana': groupedChatsStruct.lastWeek,
        'Mês Anterior': groupedChatsStruct.lastMonth,
        'Antigos': groupedChatsStruct.older
    }

    // Order of keys for display
    const groupOrder = ['Hoje', 'Ontem', 'Esta Semana', 'Mês Anterior', 'Antigos']

    const uniqueAgents = Array.from(new Set(chats.map(s => s.agentType))).filter(Boolean)

    if (isLoading && chats.length === 0) {
        return (
            <div className="space-y-8">
                <div className="flex gap-4">
                    <div className="h-10 w-full max-w-sm bg-muted/20 animate-pulse rounded-xl" />
                    <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-xl" />
                </div>
                <div className="space-y-6">
                    <div className="h-6 w-24 bg-muted/20 animate-pulse rounded-md" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (chats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 min-h-[400px]">
                <div className="p-6 rounded-full bg-primary/5 ring-1 ring-primary/10">
                    <MessageSquare className="w-10 h-10 text-primary/60" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-heading font-semibold text-foreground">Sua jornada começa aqui</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Seu histórico de conversas está vazio. Inicie um novo chat com nossos agentes especializados para começar a aprender.
                    </p>
                </div>
                <Link
                    href="/dashboard/chat"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                    <MessageSquare className="w-4 h-4" />
                    Iniciar Novo Chat
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-1 md:p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm sticky top-4 z-20 shadow-sm">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar nas conversas..."
                        className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 outline-none text-sm placeholder:text-muted-foreground/70 focus:bg-background/50 transition-colors"
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                    />
                </div>

                <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 px-2 hide-scrollbar">
                    <button
                        onClick={() => setAgentFilter('all')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                            agentFilter === 'all'
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Todos
                    </button>
                    {uniqueAgents.map(agent => (
                        <button
                            key={agent}
                            onClick={() => setAgentFilter(agent as string)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border border-transparent",
                                agentFilter === agent
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {AGENT_CONFIGS[agent as string]?.name || agent || 'OdontoGPT'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grouped by Date */}
            <div className="space-y-10">
                {Object.values(groupedSessions).every(g => g.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Nenhuma conversa encontrada com os filtros atuais.</p>
                        <button
                            onClick={() => { setSearchFilter(''); setAgentFilter('all') }}
                            className="mt-4 text-primary hover:underline text-sm"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}

                {groupOrder.map(groupKey => {
                    const groupSessions = groupedSessions[groupKey as keyof typeof groupedSessions]
                    if (!groupSessions || groupSessions.length === 0) return null

                    return (
                        <div key={groupKey} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase pl-1 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {groupKey}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupSessions.map((session, index) => {
                                    const agentType = session.agentType || 'qa'
                                    const agentConfig = AGENT_CONFIGS[agentType]
                                    const AgentIcon = getAgentUI(agentType)?.icon || Bot

                                    return (
                                        <Link
                                            key={session.id}
                                            href={`/dashboard/chat?id=${session.id}`}
                                            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card hover:bg-muted/30 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className={cn(
                                                        "p-2 rounded-lg bg-gradient-to-br transition-all duration-300 group-hover:scale-110",
                                                        getAgentUI(agentType)?.gradient || "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
                                                    )}>
                                                        <AgentIcon className="w-4 h-4 text-foreground/80" />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-muted-foreground/60 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
                                                            {agentConfig?.name || 'OdontoGPT'}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleDelete(e, session.id)}
                                                            className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-md"
                                                            title="Excluir conversa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="font-heading font-medium text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                    {session.title || 'Nova Conversa'}
                                                </h3>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                                                    <span>
                                                        {format(new Date(session.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {hasMore ? (
                <div className="flex justify-center py-6">
                    <button
                        onClick={() => loadMore()}
                        disabled={isValidating}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                    >
                        {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isValidating ? 'Carregando...' : 'Carregar mais antigos'}
                    </button>
                </div>
            ) : chats.length > 0 && (
                <div className="flex justify-center py-6 text-xs text-muted-foreground">
                    Todos os registros foram carregados
                </div>
            )}
        </div>
    )
}
