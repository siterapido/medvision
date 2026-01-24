'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Clock, RotateCcw, User, Bot, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useArtifactHistory } from '@/hooks/use-artifact-history'
import { cn } from '@/lib/utils'

interface VersionHistoryProps {
  artifactId?: string
  onClose?: () => void
}

export function VersionHistory({ artifactId, onClose }: VersionHistoryProps) {
  const { history, currentIndex, undo, redo, restore, isLoading } = useArtifactHistory(artifactId)

  if (history.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Clock className="mb-2 h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-sm text-muted-foreground">Nenhuma versão encontrada para este artifact.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Histórico de Versões</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={currentIndex >= history.length - 1 || isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Desfazer
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {history.map((item, index) => (
            <div
              key={item.version_id}
              className={cn(
                "relative flex gap-4 rounded-lg border p-3 transition-colors",
                index === currentIndex ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
              )}
            >
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border bg-background shrink-0",
                  index === currentIndex ? "border-primary text-primary" : "text-muted-foreground"
                )}>
                  {item.user_initiated ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                {index < history.length - 1 && (
                  <div className="w-px flex-1 bg-border my-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">
                    Versão {item.version_number}
                    {index === 0 && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Atual
                      </span>
                    )}
                  </span>
                  <time className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </time>
                </div>
                
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                  {item.summary || (item.user_initiated ? "Editado pelo usuário" : "Gerado por IA")}
                </p>

                {index !== currentIndex && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-[11px]"
                    onClick={() => restore(item.version_id)}
                    disabled={isLoading}
                  >
                    Restaurar esta versão
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
                
                {index === currentIndex && (
                  <div className="mt-2 flex items-center text-[11px] text-primary">
                    <Check className="mr-1 h-3 w-3" />
                    Visualizando agora
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
