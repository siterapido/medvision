'use client'

import { FixedFooter, useFixedFooterOffset } from './fixed-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

/**
 * Exemplo de implementação de um rodapé fixo para chat
 * Este componente demonstra como usar o FixedFooter na prática
 */
export function ChatFixedFooterDemo() {
  // Usar o hook para calcular offset automático se houver outros elementos fixos
  const offset = useFixedFooterOffset()

  return (
    <FixedFooter
      offset={offset}
      className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700"
      addBodyPadding={true}
    >
      <div className="flex w-full items-center gap-3">
        <Input
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
        />
        <Button 
          size="icon" 
          className="bg-primary hover:bg-primary/90 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </FixedFooter>
  )
}

/**
 * Exemplo de rodapé fixo para ações importantes
 */
export function ActionFixedFooterDemo() {
  return (
    <FixedFooter
      className="bg-background border-t"
      addBodyPadding={true}
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: R$ 199,90
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Cancelar
          </Button>
          <Button size="sm">
            Finalizar Compra
          </Button>
        </div>
      </div>
    </FixedFooter>
  )
}

/**
 * Exemplo de rodapé fixo sticky para uso em containers com scroll
 */
export function StickyFooterDemo() {
  return (
    <FixedFooter
      useSticky={true}
      className="bg-muted border-t"
      addBodyPadding={false}
    >
      <div className="text-center text-sm text-muted-foreground">
        Este rodapé fica sticky dentro do container
      </div>
    </FixedFooter>
  )
}