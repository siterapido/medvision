'use client'

/**
 * Agent Switcher - Perplexity-style Pills
 *
 * Grupo de pills/chips que permitem trocar entre agentes.
 * Visual inspirado nos "modes" da Perplexity (Search, Pro, Focus).
 */

import {
  Sparkles
} from "lucide-react"
import { cn } from '@/lib/utils'
import { getAgentUI } from '@/lib/ai/agents/ui-config'

export interface AgentPill {
  id: string
  icon: React.ReactNode
  shortName: string
  fullName: string
  placeholder: string
  color: string
}

export const AGENT_PILLS: AgentPill[] = [
  {
    id: 'odonto-gpt',
    icon: <Sparkles className="w-4 h-4" />,
    shortName: 'GPT',
    fullName: 'Odonto GPT',
    placeholder: 'Pergunte sobre odontologia...',
    color: '#00A3FF',
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
        'flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-2xl',
        'border border-zinc-100 dark:border-zinc-800/50',
        className
      )}
    >
      {agents.map((agent) => {
        const isSelected = selectedAgent === agent.id

        const agentUIConfig = getAgentUI(agent.id)

        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onAgentChange(agent.id)}
            disabled={disabled}
            className={cn(
              'relative flex items-center justify-center h-7 w-7 rounded-xl',
              'transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? `bg-gradient-to-br ${agentUIConfig.gradient} shadow-md text-white`
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-800'
            )}
            title={agent.fullName}
            aria-pressed={isSelected}
            aria-label={`Selecionar ${agent.fullName}`}
          >
            <span className={cn(
              'transition-transform duration-300',
              isSelected ? 'scale-100' : 'scale-90'
            )}>
              {agent.icon}
            </span>
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
