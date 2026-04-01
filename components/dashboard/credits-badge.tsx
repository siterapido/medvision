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

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        className
      )}
      title="Créditos ilimitados"
    >
      <Zap className="h-3 w-3 text-green-500" />
      <span>∞ Créditos</span>
    </div>
  )
}
