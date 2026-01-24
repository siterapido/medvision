'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HistoricoHeaderProps {
  total: number
}

export function HistoricoHeader({ total }: HistoricoHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)]">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
          Historico
        </h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          {total} conversa{total !== 1 ? 's' : ''}
        </p>
      </div>
      <Button
        onClick={() => router.push('/dashboard/chat')}
        className="bg-[var(--brand)] hover:bg-[var(--brand-muted)] text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova Conversa
      </Button>
    </div>
  )
}
