'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, MessageSquare, ArrowRight, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatWithPreview } from '@/lib/db/queries'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentUI } from '@/lib/ai/agents/ui-config'

interface HistoricoCardProps {
  chat: ChatWithPreview
  onDelete: (id: string) => void
}

export function HistoricoCard({ chat, onDelete }: HistoricoCardProps) {
  const agentConfig = AGENT_CONFIGS[chat.agentType || '']
  const agentUI = getAgentUI(chat.agentType || '')
  const AgentIcon = agentUI?.icon || MessageSquare

  return (
    <Link href={`/dashboard/chat?id=${chat.id}`}>
      <Card
        className={cn(
          'group p-4 h-full',
          'bg-[var(--surface-200)] border-[var(--border-default)]',
          'hover:border-[var(--brand)] hover:shadow-lg hover:shadow-[var(--brand-glow)]',
          'transition-all duration-200'
        )}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg transition-transform group-hover:scale-110',
                agentUI?.gradient || 'bg-[var(--surface-300)]'
              )}
            >
              <AgentIcon className="w-4 h-4 text-[var(--text-primary)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--brand)] transition-colors">
                {chat.title}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {format(new Date(chat.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] bg-[var(--surface-300)] border-[var(--border-subtle)] text-[var(--text-muted)]"
          >
            {agentConfig?.name || chat.agentType || 'Chat'}
          </Badge>
        </div>

        {/* Preview Messages */}
        {chat.preview && chat.preview.length > 0 && (
          <div className="space-y-2 mb-4">
            {chat.preview.slice(0, 2).map((msg) => (
              <div
                key={msg.id}
                className="flex gap-2 text-sm text-[var(--text-secondary)]"
              >
                <div className="shrink-0 mt-0.5">
                  {msg.role === 'user' ? (
                    <User className="h-3 w-3 text-[var(--text-tertiary)]" />
                  ) : (
                    <Bot className="h-3 w-3 text-[var(--brand)]" />
                  )}
                </div>
                <p className="line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)]">
            {chat.messageCount} mensagen{chat.messageCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(chat.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <ArrowRight className="h-4 w-4 text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
