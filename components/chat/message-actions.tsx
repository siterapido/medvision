'use client'

/**
 * MessageActions - Vercel Chat SDK Pattern
 *
 * Acoes para mensagens: copiar, editar, regenerar.
 * Aparece no hover da mensagem.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, Pencil, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  messageId: string
  content: string
  role: 'user' | 'assistant'
  onEdit?: (messageId: string) => void
  onRegenerate?: () => void
  className?: string
}

export function MessageActions({
  messageId,
  content,
  role,
  onEdit,
  onRegenerate,
  className,
}: MessageActionsProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      toast.success('Copiado!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100',
        className
      )}
    >
      {/* Copiar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isCopied ? 'Copiado!' : 'Copiar'}
        </TooltipContent>
      </Tooltip>

      {/* Editar (apenas para mensagens do usuario) */}
      {role === 'user' && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(messageId)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Editar</TooltipContent>
        </Tooltip>
      )}

      {/* Regenerar (apenas para mensagens do assistente) */}
      {role === 'assistant' && onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onRegenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Regenerar</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
