'use client'

import { Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

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
    const compareOpen = mode === 'compare'

    return (
        <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Modelo de IA</span>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 border border-border/50">
                <span className="text-sm">Kimi k2.6</span>
            </div>

            {mode === 'single' && selectedModel !== 'moonshotai/kimi-k2.6' && (
                <input type="hidden" name="model" value={selectedModel} />
            )}
        </GlassCard>
    )
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
                <SelectTrigger className="w-full h-9 text-sm min-h-11 sm:min-h-9">
                    <SelectValue placeholder="Escolha um modelo" />
                </SelectTrigger>
                <SelectContent>
                    {PROVIDERS.map((provider) => {
                        const models = VISION_MODELS_LIST.filter((m) => m.provider === provider && m.id !== exclude)
                        if (models.length === 0) return null
                        return (
                            <SelectGroup key={provider}>
                                <SelectLabel className="flex items-center gap-1.5 py-1">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${PROVIDER_COLORS[provider] ?? ''}`}>
                                        {provider}
                                    </Badge>
                                </SelectLabel>
                                {models.map((m) => (
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
    const compareOpen = mode === 'compare'

    return (
        <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Modelo de IA</span>
            </div>

            {mode === 'single' && <ModelSelect value={selectedModel} onChange={onModelChange} label="Modelo para análise" />}

            <Collapsible open={compareOpen} onOpenChange={(open) => onModeChange(open ? 'compare' : 'single')}>
                <CollapsibleTrigger
                    className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                        compareOpen
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40',
                    )}
                >
                    <span className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 shrink-0" />
                        Comparar dois modelos (avançado)
                    </span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', compareOpen && 'rotate-180')} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3 data-[state=closed]:animate-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </CollapsibleContent>
            </Collapsible>
        </GlassCard>
    )
}
