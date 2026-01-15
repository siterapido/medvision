"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AgentConfigDialog } from "./agent-config-dialog"
import { AGENT_CONFIGS, type AgentInfo } from "@/lib/agent-config"
import {
    Bot,
    Settings,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface AgentConfig {
    id: string
    agent_id: string
    display_name: string
    model_id: string
    temperature: number
    max_tokens: number
    is_enabled: boolean
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export function AgentsConfigManager() {
    const [configs, setConfigs] = useState<AgentConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const fetchConfigs = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/admin/agents")
            if (!response.ok) throw new Error("Erro ao carregar configurações")
            const data = await response.json()
            setConfigs(data)
        } catch (error) {
            console.error("Error fetching configs:", error)
            toast.error("Erro ao carregar configurações de agentes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfigs()
    }, [])

    const handleToggleEnabled = async (config: AgentConfig) => {
        try {
            const response = await fetch("/api/admin/agents", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: config.id,
                    is_enabled: !config.is_enabled
                })
            })

            if (!response.ok) throw new Error("Erro ao atualizar")

            setConfigs(prev =>
                prev.map(c =>
                    c.id === config.id
                        ? { ...c, is_enabled: !c.is_enabled }
                        : c
                )
            )

            toast.success(
                config.is_enabled
                    ? `${config.display_name} desativado`
                    : `${config.display_name} ativado`
            )
        } catch (error) {
            console.error("Error toggling agent:", error)
            toast.error("Erro ao atualizar status do agente")
        }
    }

    const handleOpenConfig = (config: AgentConfig) => {
        setSelectedAgent(config)
        setDialogOpen(true)
    }

    const handleSaveConfig = async (updatedConfig: Partial<AgentConfig>) => {
        if (!selectedAgent) return

        try {
            const response = await fetch("/api/admin/agents", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedAgent.id,
                    ...updatedConfig
                })
            })

            if (!response.ok) throw new Error("Erro ao salvar")

            const savedConfig = await response.json()
            setConfigs(prev =>
                prev.map(c => c.id === savedConfig.id ? savedConfig : c)
            )

            toast.success("Configuração salva com sucesso")
            setDialogOpen(false)
            setSelectedAgent(null)
        } catch (error) {
            console.error("Error saving config:", error)
            toast.error("Erro ao salvar configuração")
        }
    }

    const getAgentVisualInfo = (agentId: string): AgentInfo | undefined => {
        return AGENT_CONFIGS[agentId]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                        {configs.length} agentes configurados
                    </Badge>
                    <Badge
                        variant="outline"
                        className="text-green-400 border-green-900 bg-green-950/30"
                    >
                        {configs.filter(c => c.is_enabled).length} ativos
                    </Badge>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchConfigs}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            {/* Agents Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {configs.map(config => {
                    const visualInfo = getAgentVisualInfo(config.agent_id)
                    const IconComponent = visualInfo?.icon || Bot

                    return (
                        <Card
                            key={config.id}
                            className={`border transition-all duration-200 ${config.is_enabled
                                    ? "border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-slate-600"
                                    : "border-slate-800 bg-slate-900/50 opacity-60"
                                }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl p-2.5 ${visualInfo
                                                ? `bg-gradient-to-br ${visualInfo.gradient} bg-opacity-20`
                                                : "bg-slate-800"
                                            }`}>
                                            <IconComponent className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-slate-100">
                                                {config.display_name}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                                {config.agent_id}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.is_enabled}
                                        onCheckedChange={() => handleToggleEnabled(config)}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model Info */}
                                <div className="p-3 rounded-lg bg-slate-800/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-400">Modelo</span>
                                        {config.is_enabled ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-slate-500" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                        {config.model_id}
                                    </p>
                                </div>

                                {/* Parameters */}
                                <div className="flex gap-3">
                                    <div className="flex-1 p-2 rounded-lg bg-slate-800/30">
                                        <span className="text-xs text-slate-500">Temp</span>
                                        <p className="text-sm font-medium text-slate-300">
                                            {config.temperature}
                                        </p>
                                    </div>
                                    <div className="flex-1 p-2 rounded-lg bg-slate-800/30">
                                        <span className="text-xs text-slate-500">Max Tokens</span>
                                        <p className="text-sm font-medium text-slate-300">
                                            {config.max_tokens.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => handleOpenConfig(config)}
                                >
                                    <Settings className="h-4 w-4" />
                                    Configurar
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Config Dialog */}
            <AgentConfigDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                config={selectedAgent}
                onSave={handleSaveConfig}
            />
        </div>
    )
}
