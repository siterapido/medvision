'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import useSWRInfinite from 'swr/infinite'
import { Loader2, MessageSquare, Search } from 'lucide-react'
import { isToday, isYesterday, subWeeks, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'
import { HistoricoHeader } from './historico-header'
import { HistoricoFilters } from './historico-filters'
import { HistoricoCard } from './historico-card'
import type { ChatWithPreview } from '@/lib/db/queries'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SearchResponse {
  results: Array<{
    id: string
    title: string
    agentType: string
    createdAt: string
    updatedAt: string
    snippet: string | null
    messageCount: number
  }>
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 12

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

type GroupedChats = {
  today: ChatWithPreview[]
  yesterday: ChatWithPreview[]
  lastWeek: ChatWithPreview[]
  lastMonth: ChatWithPreview[]
  older: ChatWithPreview[]
}

const groupChatsByDate = (chats: ChatWithPreview[]): GroupedChats => {
  const now = new Date()
  const oneWeekAgo = subWeeks(now, 1)
  const oneMonthAgo = subMonths(now, 1)

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt)

      if (isToday(chatDate)) {
        groups.today.push(chat)
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat)
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat)
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat)
      } else {
        groups.older.push(chat)
      }

      return groups
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  )
}

export function HistoricoListEnhanced() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Build URL with filters
  const buildUrl = useCallback(
    (pageIndex: number, offset: number) => {
      const params = new URLSearchParams()
      params.set('limit', PAGE_SIZE.toString())
      params.set('offset', offset.toString())

      if (searchQuery) params.set('q', searchQuery)
      if (agentFilter !== 'all') params.set('agent', agentFilter)
      if (dateFrom) params.set('from', dateFrom.toISOString())
      if (dateTo) params.set('to', dateTo.toISOString())

      return `/api/history/search?${params.toString()}`
    },
    [searchQuery, agentFilter, dateFrom, dateTo]
  )

  const getKey = (pageIndex: number, previousPageData: SearchResponse | null) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const offset = pageIndex * PAGE_SIZE
    return buildUrl(pageIndex, offset)
  }

  const {
    data: pages,
    size,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<SearchResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  })

  const allChats = useMemo(() => {
    if (!pages) return []
    return pages.flatMap((page) =>
      page.results.map((result) => ({
        id: result.id,
        title: result.title,
        createdAt: new Date(result.createdAt),
        userId: '',
        visibility: 'private' as const,
        agentType: result.agentType,
        preview: [],
        messageCount: result.messageCount,
      }))
    ) as ChatWithPreview[]
  }, [pages])

  const total = pages?.[0]?.total || 0
  const hasMore = pages ? pages[pages.length - 1]?.hasMore : false
  const isEmpty = !isLoading && allChats.length === 0

  const groupedChats = useMemo(() => groupChatsByDate(allChats), [allChats])

  const availableAgents = useMemo(() => {
    const agents = new Set<string>()
    allChats.forEach((chat) => {
      if (chat.agentType) agents.add(chat.agentType)
    })
    return Array.from(agents)
  }, [allChats])

  const handleDelete = async () => {
    if (!deleteId) return
    setShowDeleteDialog(false)

    const deletePromise = fetch(`/api/chat?id=${deleteId}`, { method: 'DELETE' })

    toast.promise(deletePromise, {
      loading: 'Excluindo conversa...',
      success: () => {
        mutate()
        return 'Conversa excluida'
      },
      error: 'Erro ao excluir conversa',
    })
  }

  const renderGroup = (title: string, chats: ChatWithPreview[]) => {
    if (chats.length === 0) return null
    return (
      <div key={title} className="space-y-4">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <HistoricoCard
              key={chat.id}
              chat={chat}
              onDelete={(id) => {
                setDeleteId(id)
                setShowDeleteDialog(true)
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--canvas)]">
      <HistoricoHeader total={total} />

      <HistoricoFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        agentFilter={agentFilter}
        onAgentChange={setAgentFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        availableAgents={availableAgents}
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-[var(--surface-200)] mb-4">
              {searchQuery ? (
                <Search className="h-8 w-8 text-[var(--text-muted)]" />
              ) : (
                <MessageSquare className="h-8 w-8 text-[var(--text-muted)]" />
              )}
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-md">
              {searchQuery
                ? 'Tente buscar por outros termos ou limpe os filtros.'
                : 'Inicie uma nova conversa para comecar seu historico.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {renderGroup('Hoje', groupedChats.today)}
            {renderGroup('Ontem', groupedChats.yesterday)}
            {renderGroup('Ultimos 7 dias', groupedChats.lastWeek)}
            {renderGroup('Ultimos 30 dias', groupedChats.lastMonth)}
            {renderGroup('Mais antigos', groupedChats.older)}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <motion.div
                onViewportEnter={() => {
                  if (!isValidating && hasMore) {
                    setSize(size + 1)
                  }
                }}
                className="flex justify-center py-8"
              >
                {isValidating && (
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[var(--surface-200)] border-[var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">
              Excluir conversa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              Esta acao nao pode ser desfeita. A conversa sera removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[var(--surface-300)] text-[var(--text-primary)] border-[var(--border-default)]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
