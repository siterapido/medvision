'use client'

/**
 * Agent Switcher - Pills com todos os agentes disponíveis
 */

import { Sparkles, FlaskConical, GraduationCap, FileText, ScanEye } from 'lucide-react'
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
    id: 'medvision',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    shortName: 'GPT',
    fullName: 'MedVision',
    placeholder: 'Pergunte sobre radiografias, tomografias ou estudo...',
    color: '#00A3FF',
  },
  {
    id: 'odonto-research',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    shortName: 'Pesquisa',
    fullName: 'Odonto Research',
    placeholder: 'Pesquise artigos e evidências científicas...',
    color: '#BF5AF2',
  },
  {
    id: 'odonto-practice',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    shortName: 'Casos',
    fullName: 'Odonto Practice',
    placeholder: 'Gere casos clínicos e simulados...',
    color: '#FF9F0A',
  },
  {
    id: 'odonto-summary',
    icon: <FileText className="w-3.5 h-3.5" />,
    shortName: 'Resumo',
    fullName: 'Odonto Summary',
    placeholder: 'Crie resumos, flashcards e mapas mentais...',
    color: '#30D158',
  },
  {
    id: 'odonto-vision',
    icon: <ScanEye className="w-3.5 h-3.5" />,
    shortName: 'Visão',
    fullName: 'Med Vision',
    placeholder: 'Envie radiografia ou tomografia para análise...',
    color: '#FF6B6B',
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
        'overflow-x-auto scrollbar-hide',
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
              'relative flex items-center gap-1.5 px-2.5 h-7 rounded-xl shrink-0',
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
            <span className={cn(
              'text-[11px] font-semibold transition-all duration-300 hidden sm:block',
              isSelected ? 'opacity-100' : 'opacity-70'
            )}>
              {agent.shortName}
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
