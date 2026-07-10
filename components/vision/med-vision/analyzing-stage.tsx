'use client'

import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { MedVisionStepIndicator } from '@/components/vision/med-vision/step-indicator'
import { MedVisionAiBadge } from '@/components/vision/med-vision/med-vision-ai-badge'
import type { VisionState } from '@/components/vision/med-vision/vision-wizard-state'
import { cn } from '@/lib/utils'

type AnalyzingStageProps = {
    state: VisionState
    image: string | null
    progress: number
}

const PANEL = 'rounded-xl border border-rule bg-surface-raised'

function progressLabel(progress: number): string {
    if (progress < 25) return 'Preparando imagem…'
    if (progress < 55) return 'Analisando achados…'
    if (progress < 85) return 'Gerando laudo…'
    return 'Finalizando…'
}

export function AnalyzingStage({ state, image, progress }: AnalyzingStageProps) {
    return (
        <div className="w-full space-y-4">
            <MedVisionStepIndicator state={state} />
            <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col items-center justify-center min-h-[min(420px,60vh)]"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className={cn(PANEL, 'w-full max-w-xl overflow-hidden')}>
                    <div className="relative aspect-video bg-surface">
                        {image && (
                            <img
                                src={image}
                                className="w-full h-full object-contain opacity-70"
                                alt=""
                            />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-signal/40" />
                    </div>

                    <div className="px-6 py-5 flex flex-col items-center gap-3 border-t border-rule">
                        <Loader2 className="w-7 h-7 text-signal animate-spin" aria-hidden />
                        <div className="text-center space-y-1">
                            <h3 className="font-heading font-semibold text-base text-ink">Processando imagem</h3>
                            <MedVisionAiBadge className="justify-center" />
                            <p className="text-[11px] text-ink-muted pt-1">
                                Análises complexas podem levar até cerca de 2 minutos.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mt-6 space-y-2">
                    <div className="flex justify-between text-sm font-medium text-ink">
                        <span>{progressLabel(progress)}</span>
                        <span className="tabular-nums text-ink-muted" aria-hidden="true">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>
            </motion.div>
        </div>
    )
}
