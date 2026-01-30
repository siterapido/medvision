'use client'

/**
 * Greeting - Mobile-First Tech Design System
 *
 * Componente de boas-vindas minimalista:
 * - Ícone centralizado com gradiente azul e efeito glow
 * - Saudação "Olá, Doutor(a)"
 * - Subtítulo
 * - Sugestões foram movidas para o input
 */

import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GreetingProps {
  userName?: string
}

export function Greeting({ userName }: GreetingProps) {
  // Format display name: "Doutor(a)" or "Doutor(a), FirstName"
  const displayName = 'Doutor(a)'

export function Greeting() {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
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
          Olá, {displayName}
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-muted-foreground"
        >
          Estou pronto para auxiliar em diagnósticos e pesquisas clínicas.
        </motion.p>
      </div>
    </div>
  )
}
