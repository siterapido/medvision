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
import { Logo } from '@/components/logo'

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
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5"
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <SparklesIcon className="size-10 text-primary/80" />
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
      className="mx-auto flex size-full max-w-3xl flex-col items-center justify-center px-1 xs:px-4 md:px-8"
      key="overview"
    >
      {/* Title / Logo area */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 flex items-center justify-center gap-3"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <Logo width={200} height={60} />
      </motion.div>

      {/* Subtitle */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-lg text-muted-foreground/60 max-w-md"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Como posso ajudar você hoje?
      </motion.div>

      {/* Suggestions - Minimalist Pills */}
      {onSuggestionClick && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7 }}
        >
          {SUGGESTIONS.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-background hover:text-foreground active:scale-95"
              initial={{ opacity: 0, y: 10 }}
              onClick={() => onSuggestionClick(suggestion)}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <SparklesIcon size={14} className="opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
