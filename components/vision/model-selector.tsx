'use client'

import { Sparkles, GitBranch, Info } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { VISION_MODELS_LIST } from '@/lib/ai/openrouter'

const PROVIDER_COLORS: Record<string, string> = {
    Google:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Anthropic:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
    OpenAI:     'bg-green-500/10 text-green-400 border-green-500/20',
    Perplexity: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    Meta:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Qwen:       'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Z-AI':     'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

const PROVIDERS = ['Google', 'Anthropic', 'OpenAI', 'Perplexity', 'Meta', 'Qwen', 'Z-AI'] as const

function ModelSelect({
    value,
    onChange,
    exclude,
    label,
}: {
    value: string
    onChange: (v: string) => void
    exclude?: string
    label: string
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Escolha um modelo" />
                </SelectTrigger>
                <SelectContent>
                    {PROVIDERS.map(provider => {
                        const models = VISION_MODELS_LIST.filter(m => m.provider === provider && m.id !== exclude)
                        if (models.length === 0) return null
                        return (
                            <SelectGroup key={provider}>
                                <SelectLabel className="flex items-center gap-1.5 py-1">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 border ${PROVIDER_COLORS[provider] ?? ''}`}
                                    >
                                        {provider}
                                    </Badge>
                                </SelectLabel>
                                {models.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="text-sm">
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
}

export interface ModelSelectorProps {
    mode: 'single' | 'compare'
    onModeChange: (mode: 'single' | 'compare') => void
    selectedModel: string
    onModelChange: (model: string) => void
    compareModelA: string
    compareModelB: string
    onCompareModelAChange: (model: string) => void
    onCompareModelBChange: (model: string) => void
}

export function ModelSelector({
    mode,
    onModeChange,
    selectedModel,
    onModelChange,
    compareModelA,
    compareModelB,
    onCompareModelAChange,
    onCompareModelBChange,
}: ModelSelectorProps) {
    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Modelo de IA</span>
            </div>

            <Tabs value={mode} onValueChange={v => onModeChange(v as 'single' | 'compare')}>
                <TabsList className="w-full mb-4 h-8">
                    <TabsTrigger value="single" className="flex-1 text-xs gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        Análise Única
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="flex-1 text-xs gap-1.5">
                        <GitBranch className="h-3 w-3" />
                        Comparar Modelos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="mt-0">
                    <ModelSelect
                        value={selectedModel}
                        onChange={onModelChange}
                        label="Modelo para análise"
                    />
                </TabsContent>

                <TabsContent value="compare" className="mt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ModelSelect
                            value={compareModelA}
                            onChange={onCompareModelAChange}
                            exclude={compareModelB}
                            label="Modelo A"
                        />
                        <ModelSelect
                            value={compareModelB}
                            onChange={onCompareModelBChange}
                            exclude={compareModelA}
                            label="Modelo B"
                        />
                    </div>
                    <div className="flex items-start gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                        <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-400 leading-snug">
                            Comparar consome 2 análises do seu limite diário.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </GlassCard>
    )
}
