"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AGENT_CONFIGS } from "@/lib/agent-config"
import { Loader2, Zap, DollarSign, Eye, EyeOff, Code, ListIcon, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface OpenRouterModel {
    id: string
    name: string
    provider: string
    context_length: number
    supports_vision: boolean
    pricing: {
        prompt: number
        completion: number
    }
}

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

interface AgentConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    config: AgentConfig | null
    onSave: (config: Partial<AgentConfig>) => Promise<void>
}

export function AgentConfigDialog({
    open,
    onOpenChange,
    config,
    onSave,
}: AgentConfigDialogProps) {
    const [models, setModels] = useState<OpenRouterModel[]>([])
    const [loadingModels, setLoadingModels] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modelInputMode, setModelInputMode] = useState<"select" | "manual">("select")

    // Form state
    const [modelId, setModelId] = useState("")
    const [manualModelId, setManualModelId] = useState("")
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(4096)
    const [apiKey, setApiKey] = useState("")
    const [baseURL, setBaseURL] = useState("")

    // Fetch available models
    useEffect(() => {
        const fetchModels = async () => {
            try {
                setLoadingModels(true)
                const response = await fetch("/api/admin/agents/models")
                if (!response.ok) throw new Error("Erro ao carregar modelos")
                const data = await response.json()
                setModels(data)
            } catch (error) {
                console.error("Error fetching models:", error)
                toast.error("Erro ao carregar modelos disponíveis")
            } finally {
                setLoadingModels(false)
            }
        }

        if (open) fetchModels()
    }, [open])

    // Initialize form with config values
    useEffect(() => {
        if (config) {
            const isPresetModel = models.some(m => m.id === config.model_id)

            if (isPresetModel || models.length === 0) {
                setModelId(config.model_id)
                setManualModelId("")
                setModelInputMode("select")
            } else {
                setManualModelId(config.model_id)
                setModelId("")
                setModelInputMode("manual")
            }

            setTemperature(Number(config.temperature))
            setMaxTokens(config.max_tokens)

            // Safe access to metadata
            const metadata = config.metadata as Record<string, unknown> || {}
            setApiKey(typeof metadata.api_key === 'string' ? metadata.api_key : "")
            setBaseURL(typeof metadata.base_url === 'string' ? metadata.base_url : "")
        } else {
            // Reset fields for new agent (though currently we only edit)
            setApiKey("")
            setBaseURL("")
        }
    }, [config, models])

    const handleSave = async () => {
        if (!config) return

        const selectedModelId = modelInputMode === "manual" ? manualModelId : modelId

        if (!selectedModelId) {
            toast.error("Selecione ou digite um modelo")
            return
        }

        try {
            setSaving(true)

            // Preserve existing metadata
            const currentMetadata = config.metadata as Record<string, unknown> || {}

            await onSave({
                model_id: selectedModelId,
                temperature,
                max_tokens: maxTokens,
                metadata: {
                    ...currentMetadata,
                    api_key: apiKey || null,
                    base_url: baseURL || null
                }
            })
        } finally {
            setSaving(false)
        }
    }

    const effectiveModelId = modelInputMode === "manual" ? manualModelId : modelId
    const selectedModel = models.find(m => m.id === effectiveModelId)
    const visualInfo = config ? AGENT_CONFIGS[config.agent_id] : undefined
    const IconComponent = visualInfo?.icon

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] bg-slate-900 border-slate-800">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {IconComponent && (
                            <div className={`rounded-xl p-2.5 bg-gradient-to-br ${visualInfo?.gradient}`}>
                                <IconComponent className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-slate-100">
                                Configurar {config?.display_name}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Ajuste o modelo e parâmetros do agente
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Model Selection with Tabs */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Modelo OpenRouter</Label>
                            <a
                                href="https://openrouter.ai/models"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                                Ver todos os modelos
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>

                        <Tabs value={modelInputMode} onValueChange={(v) => setModelInputMode(v as "select" | "manual")}>
                            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                <TabsTrigger value="select" className="gap-2 data-[state=active]:bg-slate-700">
                                    <ListIcon className="h-4 w-4" />
                                    Modelos Populares
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-slate-700">
                                    <Code className="h-4 w-4" />
                                    Código do Modelo
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="select" className="mt-3">
                                {loadingModels ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                                    </div>
                                ) : (
                                    <Select value={modelId} onValueChange={setModelId}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                                            <SelectValue placeholder="Selecione um modelo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                                            {models.map(model => (
                                                <SelectItem
                                                    key={model.id}
                                                    value={model.id}
                                                    className="text-slate-200 focus:bg-slate-700 focus:text-white"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{model.name}</span>
                                                        {model.pricing.prompt === 0 && (
                                                            <Badge className="bg-green-900/50 text-green-400 text-[10px]">
                                                                Gratuito
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </TabsContent>

                            <TabsContent value="manual" className="mt-3 space-y-2">
                                <Input
                                    value={manualModelId}
                                    onChange={e => setManualModelId(e.target.value)}
                                    placeholder="Ex: openai/gpt-4o, anthropic/claude-3.5-sonnet"
                                    className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500">
                                    Digite o código exato do modelo conforme listado no OpenRouter (formato: provider/model-name)
                                </p>
                            </TabsContent>
                        </Tabs>

                        {/* Model Info - shows for preset models */}
                        {selectedModel && modelInputMode === "select" && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                                    {selectedModel.provider}
                                </Badge>
                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                                    <Zap className="h-3 w-3 mr-1" />
                                    {(selectedModel.context_length / 1000).toFixed(0)}K contexto
                                </Badge>
                                {selectedModel.supports_vision ? (
                                    <Badge variant="outline" className="text-xs text-green-400 border-green-900">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Visão
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-slate-500 border-slate-700">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Sem visão
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    ${selectedModel.pricing.prompt}/1M input
                                </Badge>
                            </div>
                        )}

                        {/* Current model indicator for manual mode */}
                        {modelInputMode === "manual" && manualModelId && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                                <Code className="h-4 w-4 text-primary" />
                                <span className="text-sm text-slate-300 font-mono">{manualModelId}</span>
                            </div>
                        )}
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Temperatura</Label>
                            <span className="text-sm font-medium text-slate-400">
                                {temperature.toFixed(2)}
                            </span>
                        </div>
                        <Slider
                            value={[temperature]}
                            onValueChange={([value]) => setTemperature(value)}
                            min={0}
                            max={2}
                            step={0.05}
                            className="py-2"
                        />
                        <p className="text-xs text-slate-500">
                            Menor = respostas mais focadas e determinísticas. Maior = respostas mais criativas.
                        </p>
                    </div>

                    {/* Max Tokens Input */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Max Tokens</Label>
                        <Input
                            type="number"
                            value={maxTokens}
                            onChange={e => setMaxTokens(parseInt(e.target.value) || 4096)}
                            min={256}
                            max={128000}
                            className="bg-slate-800 border-slate-700 text-slate-200"
                        />
                        <p className="text-xs text-slate-500">
                            Limite máximo de tokens na resposta do modelo (256 - 128.000)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-800">
                        <div className="space-y-2">
                            <Label className="text-slate-300">API Key (Opcional)</Label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="bg-slate-800 border-slate-700 text-slate-200 pr-9"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                    <EyeOff className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                Chave de API específica para este agente. Se vazio, usa a chave de ambiente.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Base URL (Opcional)</Label>
                            <Input
                                type="text"
                                value={baseURL}
                                onChange={e => setBaseURL(e.target.value)}
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-700 text-slate-200"
                            />
                            <p className="text-xs text-slate-500">
                                URL base para a API (ex: para modelos locais ou proxies).
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !effectiveModelId}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar Alterações"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
