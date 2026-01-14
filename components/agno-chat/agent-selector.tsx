"use client"

import { Bot, Loader2, WifiOff } from "lucide-react"
import type { AgentDetails } from "@/lib/agno"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AgentSelectorProps {
    agents: AgentDetails[]
    selectedAgent: AgentDetails | null
    onSelect: (agent: AgentDetails) => void
    isLoading?: boolean
    isConnected?: boolean
    error?: string | null
}

export function AgentSelector({
    agents,
    selectedAgent,
    onSelect,
    isLoading = false,
    isConnected = true,
    error,
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

    return (
        <Select
            value={selectedAgent?.id}
            onValueChange={(value) => {
                const agent = agents.find(a => a.id === value)
                if (agent) onSelect(agent)
            }}
        >
            <SelectTrigger className="w-[200px] h-9 border-slate-700/50 bg-slate-800/50 text-slate-200 focus:ring-cyan-500/20 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="truncate text-sm">
                        {selectedAgent?.name || "Selecionar Agente"}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map((agent) => (
                    <SelectItem
                        key={agent.id}
                        value={agent.id}
                        className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                    >
                        <div className="flex flex-col text-left">
                            <span className="font-medium">{agent.name}</span>
                            {agent.description && (
                                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                    {agent.description}
                                </span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
