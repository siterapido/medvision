'use client'

/**
 * Greeting - Restored from commit 3816e13
 *
 * Componente de boas-vindas com visual elegante:
 * - Icone centralizado com gradiente azul e efeito glow
 * - Saudacao "Ola, Doutor(a)"
 * - Sugestoes em scroll horizontal (mobile) ou vertical (desktop)
 */

import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface GreetingProps {
  userName?: string
  onSuggestionClick?: (suggestion: string) => void
}

const SUGGESTIONS = [
  'Anatomia do primeiro molar',
  'Preparo cavitario classe I',
  'Protocolo de anestesia',
  'Tratamento endodontico',
]

export function Greeting({ userName, onSuggestionClick }: GreetingProps) {
  const isMobile = useIsMobile()
  // Format display name: "Doutor(a)" or "Doutor(a), FirstName"
  const displayName = userName
    ? `Doutor(a)`
    : 'Doutor(a)'

  return (
    <div
      className="flex size-full flex-col items-center justify-center text-center p-4 space-y-6 animate-in fade-in zoom-in-95 duration-500"
      key="greeting"
    >
      {/* Icon with gradient and glow effect */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key="odonto-icon"
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className={cn(
              'h-14 w-14 md:h-20 md:w-20 rounded-2xl flex items-center justify-center',
              'backdrop-blur-sm border border-border/50 shadow-xl',
              'bg-gradient-to-br from-[#00D4FF] via-[#00A3FF] to-[#0066FF]'
            )}
          >
            <Sparkles className="h-7 w-7 md:h-10 md:w-10 text-white" />
          </motion.div>
        </AnimatePresence>
        {/* Glow effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute -inset-4 blur-3xl -z-10 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00D4FF]"
        />
      </div>

      {/* Title and subtitle */}
      <div className="space-y-2 max-w-md">
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl font-heading font-semibold text-foreground"
        >
          Ola, {displayName}
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-muted-foreground"
        >
          Estou pronto para auxiliar em diagnosticos e pesquisas clinicas.
        </motion.p>
      </div>

      {/* Suggestions */}
      {onSuggestionClick && (
        <div
          className={cn(
            'w-full max-w-[90vw] md:max-w-md',
            // Mobile: horizontal scroll, Desktop: vertical centered
            isMobile
              ? 'flex flex-row overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x'
              : 'flex flex-col items-center gap-2'
          )}
        >
          {SUGGESTIONS.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                // Base styles
                'text-sm text-center rounded-2xl',
                'bg-card border border-border/50',
                'hover:bg-muted/50 hover:border-primary/20',
                'transition-all text-muted-foreground hover:text-foreground',
                'shadow-sm hover:shadow-md hover:-translate-y-0.5',
                // Mobile: fixed width with no wrap, Desktop: auto width
                isMobile
                  ? 'flex-shrink-0 snap-center px-4 py-2.5 whitespace-nowrap min-w-[180px]'
                  : 'px-5 py-2.5 w-full'
              )}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
