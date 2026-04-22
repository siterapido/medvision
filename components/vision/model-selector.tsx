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
}: ModelSelectorProps) {
    return (
        <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Modelo de IA</span>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 border border-border/50">
                <span className="text-sm">Kimi k2.6</span>
            </div>
        </GlassCard>
    )
}