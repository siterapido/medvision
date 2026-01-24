'use client'

/**
 * Greeting - Vercel Chat SDK Pattern
 *
 * Componente de boas-vindas com animacao suave e sugestoes clicaveis.
 * Exibido quando nao ha mensagens no chat.
 */

import { motion } from 'motion/react'
import { SparklesIcon } from './icons'

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

export function Greeting({ userName, onSuggestionClick }: GreetingProps) {
  const displayName = userName ? `, ${userName.split(' ')[0]}` : ''

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
