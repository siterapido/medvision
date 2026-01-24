'use client'

/**
 * Greeting - Vercel Chat SDK Pattern
 *
 * Componente de boas-vindas com animacao suave e sugestoes clicaveis.
 * Exibido quando nao ha mensagens no chat.
 *
 * Mobile: Logo grande centralizado estilo Perplexity
 * Desktop: Layout com icone, texto e sugestoes
 */

import { motion } from 'motion/react'
import { SparklesIcon } from './icons'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface GreetingProps {
  userName?: string
  onSuggestionClick?: (suggestion: string) => void
}

const SUGGESTIONS = [
  'Explique a anatomia do primeiro molar superior',
  'Qual o protocolo para anestesia infiltrativa?',
  'Como fazer um preparo cavitario classe I?',
  'Quais sao as fases do tratamento endodontico?',
]

// Mobile suggestions - shorter for better UX
const MOBILE_SUGGESTIONS = [
  'Anatomia do molar',
  'Anestesia infiltrativa',
  'Preparo classe I',
]

export function Greeting({ userName, onSuggestionClick }: GreetingProps) {
  const isMobile = useIsMobile()
  const displayName = userName ? `, ${userName.split(' ')[0]}` : ''

  // Mobile variant - centered logo style like Perplexity
  if (isMobile) {
    return (
      <div
        className="flex size-full flex-col items-center justify-center px-4 pb-32"
        key="overview-mobile"
      >
        {/* Large centered logo */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <span className="text-5xl">🦷</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xl font-semibold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.4 }}
        >
          Ola{displayName}!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-center text-base text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
        >
          Como posso ajudar?
        </motion.p>

        {/* Mobile suggestions - horizontal pills */}
        {onSuggestionClick && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.6 }}
          >
            {MOBILE_SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'rounded-full border border-border bg-card px-4 py-2',
                  'text-sm text-muted-foreground',
                  'transition-all active:scale-95',
                  'hover:border-primary/50 hover:text-foreground'
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                onClick={() => onSuggestionClick(suggestion)}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  // Desktop variant - original layout
  return (
    <div
      className="mx-auto mt-2 flex size-full max-w-3xl flex-col justify-center px-1 xs:mt-4 xs:px-4 md:mt-16 md:px-8"
      key="overview"
    >
      {/* Icon */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 xs:mb-4 xs:h-12 xs:w-12 xs:rounded-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <SparklesIcon size={20} className="text-primary" />
      </motion.div>

      {/* Title */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-lg xs:text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Ola{displayName}! Sou o Odonto GPT
      </motion.div>

      {/* Subtitle */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-base text-muted-foreground xs:text-lg md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        Como posso te ajudar nos estudos hoje?
      </motion.div>

      {/* Suggestions */}
      {onSuggestionClick && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 grid gap-2 xs:mt-6 sm:mt-8 sm:grid-cols-2"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7 }}
        >
          {SUGGESTIONS.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-muted-foreground transition-all active:scale-[0.98] xs:rounded-xl xs:px-4 xs:py-3 xs:text-sm hover:border-primary/50 hover:bg-muted/50 hover:text-foreground"
              initial={{ opacity: 0, y: 10 }}
              onClick={() => onSuggestionClick(suggestion)}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
