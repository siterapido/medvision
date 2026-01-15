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
            // Check if backend is available
            const agnoServiceUrl = process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://localhost:8000/api/v1"
            const baseUrl = agnoServiceUrl.replace(/\/$/, "")

            const healthUrl = baseUrl.endsWith("/api/v1")
                ? baseUrl.replace("/api/v1", "/health")
                : `${baseUrl}/health`

            const healthCheck = await fetch(healthUrl).catch(() => ({ ok: false }))
            setIsConnected(healthCheck.ok)

            if (!healthCheck.ok) {
                setError("Serviço OdontoGPT não está disponível. Verifique se o backend está rodando.")
                setAgents([])
                setSelectedAgent(null)
                return
            }

            // Fetch agents from our backend
            const agentsUrl = baseUrl.endsWith("/api/v1")
                ? `${baseUrl}/agentes`
                : `${baseUrl}/api/v1/agentes`

            const response = await fetch(agentsUrl)

            if (!response.ok) {
                throw new Error("Erro ao carregar agentes")
            }

            const data = await response.json()

            // Map backend agents to AgentDetails format
            const agentList: AgentDetails[] = data.agentes.map((agent: any) => ({
                id: agent.id,
                name: agent.nome,
                description: agent.descricao,
            }))

            setAgents(agentList)

            // Auto-select Odonto Flow (orchestrator) as default agent
            if (autoSelect && agentList.length > 0 && !selectedAgent) {
                const flowAgent = agentList.find(a => a.id === 'odonto-flow')
                setSelectedAgent(flowAgent || agentList[0])
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar agentes"
            setError(message)
            setAgents([])
        } finally {
            setIsLoading(false)
        }
    }, [autoSelect, selectedAgent])

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
