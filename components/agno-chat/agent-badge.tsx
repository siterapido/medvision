"use client"

import { cn } from "@/lib/utils"
import { getAgentInfo, AgentInfo } from "@/lib/agent-config"

interface AgentBadgeProps {
  agentId?: string
  isActive?: boolean
  className?: string
  showDescription?: boolean
}

export function AgentBadge({ agentId, isActive = false, className, showDescription = false }: AgentBadgeProps) {
  const agent = getAgentInfo(agentId)
  const Icon = agent.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
        isActive
          ? `bg-gradient-to-r ${agent.gradient} text-white border-transparent shadow-lg shadow-${agent.color}-500/30 animate-pulse-soft`
          : `bg-${agent.color}-500/10 border-${agent.color}-500/30 text-${agent.color}-400`,
        className
      )}
    >
      <Icon className={cn("w-4 h-4", isActive && "animate-spin-slow")} />
      <span className="text-sm font-medium">{agent.name}</span>
      {showDescription && (
        <span className="text-xs opacity-75 ml-1">• {agent.description}</span>
      )}
    </div>
  )
}

interface ActiveAgentIndicatorProps {
  agentId?: string
  className?: string
}

export function ActiveAgentIndicator({ agentId, className }: ActiveAgentIndicatorProps) {
  const agent = getAgentInfo(agentId)
  const Icon = agent.icon

  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm", className)}>
      <div className={cn(
        "relative flex items-center justify-center w-12 h-12 rounded-full",
        `bg-gradient-to-br ${agent.gradient} shadow-lg shadow-${agent.color}-500/50`
      )}>
        <Icon className="w-6 h-6 text-white animate-pulse" />

        {/* Animated rings */}
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          `bg-${agent.color}-400`
        )} />
        <div className={cn(
          "absolute -inset-2 rounded-full animate-pulse-slow opacity-10",
          `bg-${agent.color}-400`
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={cn("font-semibold text-sm", `text-${agent.color}-400`)}>
          {agent.name}
        </h3>
        <p className="text-xs text-slate-400 truncate">
          {agent.description}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full animate-pulse", `bg-${agent.color}-400`)} />
        <span className="text-xs text-slate-500">Ativo</span>
      </div>
    </div>
  )
}
