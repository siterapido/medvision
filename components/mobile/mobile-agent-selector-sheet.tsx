'use client'

/**
 * Mobile Agent Selector Sheet - Perplexity-style Bottom Sheet
 *
 * Bottom sheet para selecao de agente com:
 * - Lista de agentes com cores/icones da landing page
 * - Item selecionado com borda colorida
 * - Badge "pro" para agentes premium
 */

import { X, Check, ChevronDown } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AGENTS_UI_LIST, getAgentUI, type AgentUIConfig } from '@/lib/ai/agents/ui-config'

interface MobileAgentSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAgent: string
  onAgentChange: (agentId: string) => void
}

export function MobileAgentSelectorSheet({
  open,
  onOpenChange,
  selectedAgent,
  onAgentChange,
}: MobileAgentSelectorSheetProps) {
  const handleSelect = (agentId: string) => {
    onAgentChange(agentId)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Escolha o Agente</DrawerTitle>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Agent List */}
        <div className="flex flex-col gap-2 px-4 pb-4">
          {AGENTS_UI_LIST.map((agent) => (
            <AgentItem
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent === agent.id}
              onSelect={() => handleSelect(agent.id)}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface AgentItemProps {
  agent: AgentUIConfig
  isSelected: boolean
  onSelect: () => void
}

function AgentItem({ agent, isSelected, onSelect }: AgentItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex items-start gap-3 rounded-xl p-4 text-left',
        'border-2 transition-all duration-200',
        'active:scale-[0.98]',
        isSelected
          ? cn(agent.borderColor, agent.bgColor)
          : 'border-transparent bg-muted/50 hover:bg-muted'
      )}
    >
      {/* Icon - Apple/iOS style gradient */}
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg shadow-md',
          `bg-gradient-to-br ${getAgentUI(agent.id).gradient}`
        )}
      >
        {(() => {
          const IconComponent = agent.icon
          return <IconComponent className="size-5 text-white" />
        })()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{agent.name}</span>
          {agent.isPro && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                agent.bgColor,
                agent.textColor
              )}
            >
              Pro
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2',
            'flex size-5 items-center justify-center rounded-full',
            agent.textColor.replace('text-', 'bg-')
          )}
        >
          <Check className="size-3 text-white" />
        </div>
      )}
    </button>
  )
}
