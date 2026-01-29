'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FixedFooterProps {
  /**
   * Conteúdo exibido dentro do rodapé.
   */
  children: ReactNode
  /**
   * Classes CSS adicionais.
   */
  className?: string
  /**
   * Espaçamento opcional acima do rodapé (em pixels).
   */
  offset?: number
}

export function FixedFooter({
  children,
  className,
  offset = 0,
}: FixedFooterProps) {
  return (
    <div
      className={cn(
        'fixed-footer-container',
        className,
      )}
      style={offset > 0 ? { marginTop: offset } : undefined}
      data-fixed-footer="true"
    >
      {/* Container interno com padding responsivo */}
      <div className="fixed-footer-content">
        {children}
      </div>
    </div>
  )
}
