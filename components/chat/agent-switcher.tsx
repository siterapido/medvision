'use client'

/**
 * Agent Switcher - Perplexity-style Pills
 *
 * Grupo de pills/chips que permitem trocar entre agentes.
 * Visual inspirado nos "modes" da Perplexity (Search, Pro, Focus).
 */

import {
  Brain, Shield, FlaskConical,
  FileText, Eye, Sparkles, GraduationCap
} from "lucide-react"
import { cn } from '@/lib/utils'

export interface AgentPill {
  id: string
  icon: React.ReactNode
  shortName: string
  fullName: string
  placeholder: string
}

export const AGENT_PILLS: AgentPill[] = [
  {
    id: 'odonto-gpt',
    icon: <Sparkles className="w-4 h-4" />,
    shortName: 'GPT',
    fullName: 'Odonto GPT',
    placeholder: 'Pergunte sobre odontologia...',
  },
  {
    id: 'odonto-research',
    icon: <FlaskConical className="w-4 h-4" />,
    shortName: 'Research',
    fullName: 'Pesquisa Cientifica',
    placeholder: 'Busque evidencias cientificas...',
  },
  {
    id: 'odonto-practice',
    icon: <Shield className="w-4 h-4" />,
    shortName: 'Practice',
    fullName: 'Casos Clinicos',
    placeholder: 'Pratique com casos clinicos...',
  },
  {
    id: 'odonto-summary',
    icon: <GraduationCap className="w-4 h-4" />,
    shortName: 'Summary',
    fullName: 'Resumos',
    placeholder: 'Crie resumos e flashcards...',
  },
  {
    id: 'odonto-vision',
    icon: <Eye className="w-4 h-4" />,
    shortName: 'Vision',
    fullName: 'Analise de Imagens',
    placeholder: 'Envie radiografias para analise...',
  },
]

interface AgentSwitcherProps {
  agents?: AgentPill[]
  selectedAgent: string
  onAgentChange: (agentId: string) => void
  disabled?: boolean
  className?: string
}

export function AgentSwitcher({
  agents = AGENT_PILLS,
  selectedAgent,
  onAgentChange,
  disabled,
  className,
}: AgentSwitcherProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5',
        className
      )}
    >
      {agents.map((agent) => {
        const isSelected = selectedAgent === agent.id

        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onAgentChange(agent.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium',
              'transition-all duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={agent.fullName}
            aria-pressed={isSelected}
            aria-label={`Selecionar ${agent.fullName}`}
          >
            <span className="text-base leading-none">{agent.icon}</span>
            <span className="hidden sm:inline">{agent.shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

// Helper to get agent config by ID
export function getAgentPill(agentId: string): AgentPill {
  return AGENT_PILLS.find((a) => a.id === agentId) || AGENT_PILLS[0]
}
