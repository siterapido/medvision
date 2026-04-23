'use client'

import { Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { VISION_MODELS_LIST, MODELS } from '@/lib/ai/openrouter'

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
    const currentModel = VISION_MODELS_LIST.find(m => m.id === selectedModel)

    return (
        <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Modelo de IA</span>
            </div>

            {mode === 'single' ? (
                <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="w-full rounded-md bg-muted/50 px-3 py-2 border border-border/50 text-sm"
                >
                    {VISION_MODELS_LIST.map((model) => (
                        <option key={model.id} value={model.id}>
                            {model.name}
                        </option>
                    ))}
                </select>
            ) : (
                <div className="space-y-2">
                    <select
                        value={compareModelA}
                        onChange={(e) => onCompareModelAChange(e.target.value)}
                        className="w-full rounded-md bg-muted/50 px-3 py-2 border border-border/50 text-sm"
                    >
                        {VISION_MODELS_LIST.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <select
                        value={compareModelB}
                        onChange={(e) => onCompareModelBChange(e.target.value)}
                        className="w-full rounded-md bg-muted/50 px-3 py-2 border border-border/50 text-sm"
                    >
                        {VISION_MODELS_LIST.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </GlassCard>
    )
}