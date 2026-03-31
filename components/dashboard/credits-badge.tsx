'use client'

import useSWR from 'swr'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Credits {
  balance: number
  monthly_limit: number
  period_end: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function CreditsBadge({ className }: { className?: string }) {
  const { data: credits } = useSWR<Credits>('/api/user/credits', fetcher, {
    refreshInterval: 60_000, // refresh a cada minuto
  })

  if (!credits) return null

  const pct = credits.monthly_limit > 0
    ? Math.round((credits.balance / credits.monthly_limit) * 100)
    : 0

  const isLow = pct <= 20
  const isEmpty = credits.balance === 0

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        isEmpty
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : isLow
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-muted text-muted-foreground',
        className
      )}
      title={`${credits.balance} de ${credits.monthly_limit} créditos restantes este mês`}
    >
      <Zap className={cn('h-3 w-3', isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-primary')} />
      <span>
        {credits.balance.toLocaleString('pt-BR')}
        <span className="opacity-60"> / {credits.monthly_limit.toLocaleString('pt-BR')}</span>
      </span>
    </div>
  )
}
