"use client"

import { Bot, Loader2, WifiOff, Sparkles, FlaskConical, GraduationCap, FileText, ScanEye, MessageCircle } from "lucide-react"
import type { AgentConfig } from "@/lib/ai/agents/config"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AgentSelectorProps {
    agents: AgentConfig[]
    selectedAgent: AgentConfig | null
    onSelect: (agent: AgentConfig) => void
    isLoading?: boolean
    isConnected?: boolean
    error?: string | null
    compact?: boolean
    className?: string
}

// Configuração visual dos agentes - Gradientes estilo Apple (cores vibrantes, transições suaves)
const agentConfig: Record<string, { icon: React.ElementType, gradient: string, isAuto?: boolean }> = {
    // Odonto GPT agora é o agente unificado (antigo Flow)
    'odonto-gpt': { icon: Sparkles, gradient: 'from-[#00D4FF] via-[#00A3FF] to-[#0066FF]', isAuto: true },
    'odonto-research': { icon: FlaskConical, gradient: 'from-[#BF5AF2] via-[#9D4EDD] to-[#7B2CBF]' },
    'odonto-practice': { icon: GraduationCap, gradient: 'from-[#FF9F0A] via-[#FF6B35] to-[#FF453A]' },
    'odonto-summary': { icon: FileText, gradient: 'from-[#30D158] via-[#00C7BE] to-[#00B4D8]' },
    'odonto-write': { icon: FileText, gradient: 'from-[#30D158] via-[#00C7BE] to-[#00B4D8]' }, // Legacy
    'odonto-vision': { icon: ScanEye, gradient: 'from-[#FF6B6B] via-[#EE5A70] to-[#DA4167]' },
}

export function AgentSelector({
    agents,
    selectedAgent,
    onSelect,
    isLoading = false,
    isConnected = true,
    error,
    compact = false,
    className,
}: AgentSelectorProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Carregando agentes...</span>
            </div>
        )
    }

    if (!isConnected || error) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/10 border border-red-500/20">
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400">
                    {error || "AgentOS desconectado"}
                </span>
            </div>
        )
    }

    if (agents.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-900/10 border border-amber-500/20">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400">Nenhum agente disponível</span>
            </div>
        )
    }

    const flowAgent = agents.find(a => a.id === 'odonto-gpt')
    const specializedAgents = agents.filter(a => a.id !== 'odonto-gpt')

    const selectedConfig = selectedAgent ? agentConfig[selectedAgent.id] : agentConfig['odonto-gpt']
    const SelectedIcon = selectedConfig?.icon || Bot

    return (
        <Select
            value={selectedAgent?.id}
            onValueChange={(value) => {
                const agent = agents.find(a => a.id === value)
                if (agent) onSelect(agent)
            }}
        >
            <SelectTrigger className={cn(
                "h-9 border-slate-700/50 bg-slate-800/50 text-slate-200 focus:ring-cyan-500/20 hover:bg-slate-800 transition-colors",
                compact ? "w-auto px-2 border-0 bg-transparent hover:bg-slate-800/50" : "w-[220px]",
                className
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "rounded flex items-center justify-center",
                        compact ? "w-6 h-6" : "w-5 h-5",
                        `bg-gradient-to-br ${selectedConfig?.gradient || 'from-cyan-500 to-blue-500'}`
                    )}>
                        <SelectedIcon className={cn("text-white", compact ? "w-3.5 h-3.5" : "w-3 h-3")} />
                    </div>
                    {!compact && (
                        <>
                            <span className="truncate text-sm">
                                {selectedAgent?.name || "Selecionar Agente"}
                            </span>
                            {selectedAgent?.id === 'odonto-gpt' && (
                                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                    UNIFIED
                                </span>
                            )}
                        </>
                    )}
                </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 min-w-[240px]">
                {/* Fluxo Automático (Flow/GPT) */}
                {flowAgent && (
                    <SelectGroup>
                        <SelectLabel className="text-[10px] uppercase text-slate-500 px-2">
                            🤖 Odonto GPT Unificado
                        </SelectLabel>
                        <SelectItem
                            value={flowAgent.id}
                            className="text-slate-300 focus:bg-cyan-500/10 focus:text-white cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="font-medium">{flowAgent.name}</span>
                                    <span className="text-[10px] text-slate-500">
                                        Chat inteligente que chama especialistas quando necessário
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                )}

                {/* Agentes Especializados (Escolha Direta) */}
                {specializedAgents.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="text-[10px] uppercase text-slate-500 px-2 mt-2">
                            🎯 Especialistas Dedicados
                        </SelectLabel>
                        {specializedAgents.map((agent) => {
                            const config = agentConfig[agent.id] || { icon: Bot, gradient: 'from-slate-500 to-slate-600' }
                            const AgentIcon = config.icon
                            return (
                                <SelectItem
                                    key={agent.id}
                                    value={agent.id}
                                    className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 rounded flex items-center justify-center",
                                            `bg-gradient-to-br ${config.gradient}`
                                        )}>
                                            <AgentIcon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="font-medium">{agent.name}</span>
                                            {agent.description && (
                                                <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                                    {agent.description.substring(0, 50)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    )
}
