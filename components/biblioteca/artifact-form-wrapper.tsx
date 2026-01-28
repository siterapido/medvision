'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { ArtifactFormSummary } from './artifact-form-summary'
import { ArtifactFormFlashcards } from './artifact-form-flashcards'
import {
  BookMarked,
  WalletCards,
  GraduationCap,
  Search,
  Lock,
  Plus
} from 'lucide-react'

type ArtifactFormType = 'summary' | 'flashcards' | 'quiz' | 'research'

interface ArtifactTypeOption {
  id: ArtifactFormType
  label: string
  description: string
  icon: React.ElementType
  color: string
  available: boolean
}

const ARTIFACT_TYPES: ArtifactTypeOption[] = [
  {
    id: 'summary',
    label: 'Resumo',
    description: 'Textos estruturados',
    icon: BookMarked,
    color: 'violet',
    available: true
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Cards de memorizacao',
    icon: WalletCards,
    color: 'orange',
    available: true
  },
  {
    id: 'quiz',
    label: 'Simulado',
    description: 'Questoes de prova',
    icon: GraduationCap,
    color: 'amber',
    available: false
  },
  {
    id: 'research',
    label: 'Pesquisa',
    description: 'Dossies cientificos',
    icon: Search,
    color: 'cyan',
    available: false
  }
]

export function ArtifactFormWrapper() {
  const [selectedType, setSelectedType] = React.useState<ArtifactFormType>('summary')

  const colorClasses = {
    violet: {
      selected: 'border-violet-500/50 bg-violet-500/10',
      icon: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    orange: {
      selected: 'border-orange-500/50 bg-orange-500/10',
      icon: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20'
    },
    amber: {
      selected: 'border-amber-500/50 bg-amber-500/10',
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    cyan: {
      selected: 'border-cyan-500/50 bg-cyan-500/10',
      icon: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Plus className="w-4 h-4 text-primary" />
          <span className="text-primary font-semibold text-sm">Criar Novo Artefato</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground/90 mb-2">
          O que voce quer criar?
        </h2>
        <p className="text-muted-foreground">
          Selecione o tipo de material e configure como preferir
        </p>
      </motion.div>

      {/* Type Selection Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {ARTIFACT_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          const colors = colorClasses[type.color as keyof typeof colorClasses]

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1 + index * 0.05
              }}
              onClick={() => type.available && setSelectedType(type.id)}
              disabled={!type.available}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl border transition-all',
                'hover:scale-[1.02] active:scale-[0.98]',
                type.available
                  ? isSelected
                    ? colors.selected
                    : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50'
                  : 'border-border/20 bg-muted/10 cursor-not-allowed opacity-60'
              )}
            >
              {/* Lock badge for unavailable */}
              {!type.available && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                'p-3 rounded-xl border transition-colors',
                isSelected && type.available
                  ? colors.iconBg
                  : 'bg-muted/30 border-border/20'
              )}>
                <Icon className={cn(
                  'w-5 h-5 md:w-6 md:h-6 transition-colors',
                  isSelected && type.available ? colors.icon : 'text-muted-foreground'
                )} />
              </div>

              {/* Label */}
              <div className="text-center">
                <span className={cn(
                  'text-sm font-semibold block',
                  isSelected && type.available ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {type.label}
                </span>
                <span className="text-[10px] text-muted-foreground hidden md:block">
                  {type.description}
                </span>
              </div>

              {/* Coming soon badge */}
              {!type.available && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-muted/50 border border-border/30 text-[9px] text-muted-foreground whitespace-nowrap">
                  Em breve
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {selectedType === 'summary' && <ArtifactFormSummary />}
          {selectedType === 'flashcards' && <ArtifactFormFlashcards />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
