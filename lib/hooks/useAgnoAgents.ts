"use client"

import { useState, useEffect, useCallback } from "react"
import { AGNO_CONFIG, fetchAgents, checkHealth, type AgentDetails } from "@/lib/agno"

interface UseAgnoAgentsOptions {
    baseUrl?: string
    autoSelect?: boolean
}

interface UseAgnoAgentsReturn {
    agents: AgentDetails[]
    selectedAgent: AgentDetails | null
    selectAgent: (agent: AgentDetails | null) => void
    isLoading: boolean
    error: string | null
    isConnected: boolean
    refresh: () => Promise<void>
}

/**
 * Hook for fetching and managing Agno agents
 */
export function useAgnoAgents(options: UseAgnoAgentsOptions = {}): UseAgnoAgentsReturn {
    const { baseUrl = AGNO_CONFIG.baseUrl, autoSelect = true } = options

    const [agents, setAgents] = useState<AgentDetails[]>([])
    const [selectedAgent, setSelectedAgent] = useState<AgentDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const loadAgents = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            // First check if AgentOS is healthy
            const healthy = await checkHealth(baseUrl)
            setIsConnected(healthy)

            if (!healthy) {
                setError("AgentOS não está disponível. Verifique se o servidor está rodando.")
                setAgents([])
                setSelectedAgent(null)
                return
            }

            // Fetch agents
            const agentList = await fetchAgents(baseUrl)
            setAgents(agentList)

            // Auto-select first agent if enabled and no agent is selected
            if (autoSelect && agentList.length > 0 && !selectedAgent) {
                setSelectedAgent(agentList[0])
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar agentes"
            setError(message)
            setAgents([])
        } finally {
            setIsLoading(false)
        }
    }, [baseUrl, autoSelect, selectedAgent])

    // Load agents on mount
    useEffect(() => {
        loadAgents()
    }, [loadAgents])

    const selectAgent = useCallback((agent: AgentDetails | null) => {
        setSelectedAgent(agent)
    }, [])

    return {
        agents,
        selectedAgent,
        selectAgent,
        isLoading,
        error,
        isConnected,
        refresh: loadAgents,
    }
}
