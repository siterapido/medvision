'use client'

/**
 * Streaming Components for Generative UI
 *
 * Componentes que podem ser renderizados durante o streaming de respostas.
 * Usados para mostrar estados de loading e previews enquanto artifacts sao gerados.
 */

import { motion } from 'motion/react'
import {
  Loader2,
  FileText,
  BookOpen,
  ClipboardList,
  FlaskConical,
  Stethoscope,
  Sparkles,
  Brain,
  Zap,
  Code,
  Layout,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Base streaming component props
interface StreamingComponentProps {
  title?: string
  description?: string
  className?: string
}

/**
 * Loading skeleton for summaries
 */
export function SummaryStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Gerando Resumo...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Analisando conteudo e extraindo pontos-chave</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted/50 rounded animate-pulse" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for flashcards
 */
export function FlashcardStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <BookOpen className="h-5 w-5 text-blue-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Criando Flashcards...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          </div>
          <p className="text-xs text-muted-foreground">Elaborando cards de pergunta e resposta</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="h-20 bg-muted/30 rounded-lg border border-border animate-pulse"
          />
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for quiz
 */
export function QuizStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-green-500/20 bg-gradient-to-br from-card to-green-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <ClipboardList className="h-5 w-5 text-green-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Gerando Simulado...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-green-500" />
          </div>
          <p className="text-xs text-muted-foreground">Elaborando questoes e alternativas</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted/50 rounded animate-pulse" />
        <div className="space-y-2 pl-4">
          {['A', 'B', 'C', 'D', 'E'].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-muted/50 animate-pulse" />
              <div className="h-3 bg-muted/50 rounded flex-1 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for research dossier
 */
export function ResearchStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
          <FlaskConical className="h-5 w-5 text-purple-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Pesquisando...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
          </div>
          <p className="text-xs text-muted-foreground">Consultando literatura cientifica</p>
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-2 p-2 rounded bg-muted/20"
          >
            <div className="w-4 h-4 rounded bg-purple-500/20 animate-pulse" />
            <div className="flex-1 h-3 bg-muted/50 rounded animate-pulse" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for reports/laudos
 */
export function ReportStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-red-500/20 bg-gradient-to-br from-card to-red-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
          <Stethoscope className="h-5 w-5 text-red-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Analisando Imagem...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-red-500" />
          </div>
          <p className="text-xs text-muted-foreground">Identificando estruturas e achados</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="aspect-square bg-muted/30 rounded-lg animate-pulse flex items-center justify-center">
          <Brain className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted/50 rounded animate-pulse" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-3/5" />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for code
 */
export function CodeStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-orange-500/20 bg-gradient-to-br from-card to-orange-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <Code className="h-5 w-5 text-orange-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Escrevendo Código...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
          </div>
          <p className="text-xs text-muted-foreground">Implementando lógica e algoritmos</p>
        </div>
      </div>
      <div className="space-y-2 font-mono">
        <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4 ml-4" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2 ml-4" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-1/3" />
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for diagrams
 */
export function DiagramStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-cyan-500/20 bg-gradient-to-br from-card to-cyan-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <Layout className="h-5 w-5 text-cyan-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Desenhando Diagrama...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />
          </div>
          <p className="text-xs text-muted-foreground">Estruturando fluxo e conexões</p>
        </div>
      </div>
      <div className="h-32 bg-muted/30 rounded-lg animate-pulse flex items-center justify-center border border-dashed">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded border-2 border-muted" />
          <div className="w-12 h-px bg-muted self-center" />
          <div className="w-8 h-8 rounded-full border-2 border-muted" />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Loading skeleton for text
 */
export function TextStreamingSkeleton({ title, className }: StreamingComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-slate-500/20 bg-gradient-to-br from-card to-slate-500/5 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10">
          <Type className="h-5 w-5 text-slate-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{title || 'Escrevendo...'}</h4>
            <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
          </div>
          <p className="text-xs text-muted-foreground">Redigindo documento completo</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-muted/50 rounded animate-pulse" />
        <div className="h-2 bg-muted/50 rounded animate-pulse" />
        <div className="h-2 bg-muted/50 rounded animate-pulse w-4/5" />
        <div className="h-2 bg-muted/50 rounded animate-pulse w-5/6" />
      </div>
    </motion.div>
  )
}

/**
 * Generic thinking indicator
 */
export function ThinkingIndicator({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center gap-2 text-muted-foreground', className)}
    >
      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
      <span className="text-sm">Pensando</span>
      <span className="flex gap-1">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        >
          .
        </motion.span>
      </span>
    </motion.div>
  )
}

/**
 * Tool execution indicator
 */
export function ToolExecutionIndicator({
  toolName,
  className,
}: {
  toolName: string
  className?: string
}) {
  const getToolInfo = () => {
    if (toolName.includes('summary') || toolName.includes('Summary')) {
      return { icon: FileText, label: 'Gerando resumo', color: 'text-primary' }
    }
    if (toolName.includes('flashcard') || toolName.includes('Flashcard')) {
      return { icon: BookOpen, label: 'Criando flashcards', color: 'text-blue-500' }
    }
    if (toolName.includes('quiz') || toolName.includes('Quiz')) {
      return { icon: ClipboardList, label: 'Elaborando quiz', color: 'text-green-500' }
    }
    if (toolName.includes('research') || toolName.includes('Research')) {
      return { icon: FlaskConical, label: 'Pesquisando', color: 'text-purple-500' }
    }
    if (toolName.includes('report') || toolName.includes('Report')) {
      return { icon: Stethoscope, label: 'Analisando', color: 'text-red-500' }
    }
    return { icon: Zap, label: 'Processando', color: 'text-amber-500' }
  }

  const { icon: Icon, label, color } = getToolInfo()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-muted/50 border border-border',
        className
      )}
    >
      <Icon className={cn('h-4 w-4', color)} />
      <span className="text-sm text-foreground">{label}</span>
      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
    </motion.div>
  )
}

/**
 * Streamable components map
 * Used to render streaming states for different artifact types
 */
export const streamableComponents = {
  summary: SummaryStreamingSkeleton,
  flashcards: FlashcardStreamingSkeleton,
  quiz: QuizStreamingSkeleton,
  research: ResearchStreamingSkeleton,
  report: ReportStreamingSkeleton,
  code: CodeStreamingSkeleton,
  diagram: DiagramStreamingSkeleton,
  text: TextStreamingSkeleton,
}

/**
 * Get streaming component for a tool name
 */
export function getStreamingComponent(toolName: string) {
  if (toolName.includes('summary') || toolName.includes('Summary')) {
    return SummaryStreamingSkeleton
  }
  if (toolName.includes('flashcard') || toolName.includes('Flashcard')) {
    return FlashcardStreamingSkeleton
  }
  if (toolName.includes('quiz') || toolName.includes('Quiz')) {
    return QuizStreamingSkeleton
  }
  if (toolName.includes('research') || toolName.includes('Research')) {
    return ResearchStreamingSkeleton
  }
  if (toolName.includes('report') || toolName.includes('Report')) {
    return ReportStreamingSkeleton
  }
  if (toolName.includes('code') || toolName.includes('Code')) {
    return CodeStreamingSkeleton
  }
  if (toolName.includes('diagram') || toolName.includes('Diagram')) {
    return DiagramStreamingSkeleton
  }
  if (toolName.includes('text') || toolName.includes('Text')) {
    return TextStreamingSkeleton
  }
  if (toolName === 'createDocument' || toolName === 'updateDocument') {
    return ThinkingIndicator // Default for unified tool if kind not known yet
  }
  return null
}
