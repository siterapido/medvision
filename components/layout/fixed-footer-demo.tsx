'use client'

import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FixedFooter } from './fixed-footer'

/**
 * Exemplo de implementação de um rodapé fluido para chat.
 */
export function ChatFixedFooterDemo() {
  return (
    <FixedFooter
      className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700"
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
 * Exemplo de rodapé fluido para ações importantes.
 */
export function ActionFixedFooterDemo() {
  return (
    <FixedFooter
      className="bg-background border-t"
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
 * Exemplo de rodapé fluido.
 */
export function StickyFooterDemo() {
  return (
    <FixedFooter
      className="bg-muted border-t"
    >
      <div className="text-center text-sm text-muted-foreground">
        Este rodapé acompanha o conteúdo normalmente dentro do container
      </div>
    </FixedFooter>
  )
}
