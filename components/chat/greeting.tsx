'use client'

/**
 * Greeting - Vercel Chat SDK Pattern
 * 
 * Componente de boas-vindas com animação suave.
 * Exibido quando não há mensagens no chat.
 */

import { motion } from 'motion/react'

export function Greeting() {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Ola! Sou o Odonto GPT
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-muted-foreground md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        Como posso te ajudar nos estudos hoje?
      </motion.div>
    </div>
  )
}
