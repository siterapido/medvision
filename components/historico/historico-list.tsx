'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Loader2, MessageSquare, Search } from 'lucide-react'
import { HistoricoHeader } from './historico-header'
import { HistoricoFilters } from './historico-filters'
import { HistoricoCard } from './historico-card'
import { useHistory, iterateGroups } from '@/lib/chat'
import type { ChatWithMessages } from '@/lib/chat'
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

const PAGE_SIZE = 12

export function HistoricoListEnhanced() {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    chats,
    groupedChats,
    total,
    hasMore,
    isLoading,
    isValidating,
    isEmpty,
    loadMore,
    deleteChat,
  } = useHistory({
    mode: 'offset',
    pageSize: PAGE_SIZE,
    query: searchQuery || undefined,
    agentType: agentFilter !== 'all' ? agentFilter : undefined,
    dateFrom,
    dateTo,
  })

  // Build available agents from loaded chats
  const availableAgents = useMemo(() => {
    const agents = new Set<string>()
    // Defensive check: ensure chats is an array
    if (Array.isArray(chats)) {
      chats.forEach((chat) => {
        if (chat.agentType) agents.add(chat.agentType)
      })
    }
    return Array.from(agents)
  }, [chats])

  const handleDelete = async () => {
    if (!deleteId) return
    setShowDeleteDialog(false)

    const success = await deleteChat(deleteId)
    if (success) {
      toast.success('Conversa excluida')
    } else {
      toast.error('Erro ao excluir conversa')
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--canvas)]">
      <HistoricoHeader total={total ?? 0} />

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
            {Array.from(iterateGroups(groupedChats)).map(({ key, label, chats }) => (
              <div key={key} className="space-y-4">
                <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {label}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chats.map((chat) => (
                    <HistoricoCard
                      key={chat.id}
                      chat={chat as ChatWithMessages}
                      onDelete={(id) => {
                        setDeleteId(id)
                        setShowDeleteDialog(true)
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <motion.div
                onViewportEnter={() => {
                  if (!isValidating && hasMore) {
                    loadMore()
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
