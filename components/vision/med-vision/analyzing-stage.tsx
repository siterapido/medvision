'use client'

import { motion } from 'motion/react'
import { Loader2, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { MedVisionStepIndicator } from '@/components/vision/med-vision/step-indicator'
import type { VisionState } from '@/components/vision/med-vision/vision-wizard-state'

type AnalyzingStageProps = {
    state: VisionState
    image: string | null
    progress: number
    isCompare: boolean
}

export function AnalyzingStage({ state, image, progress, isCompare }: AnalyzingStageProps) {
    return (
        <div className="w-full space-y-4">
            <MedVisionStepIndicator state={state} />
            <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center min-h-[min(500px,70vh)]"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="relative w-full max-w-xl aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-black/40">
                    {image && <img src={image} className="w-full h-full object-cover opacity-60 grayscale" alt="" />}
                    <motion.div
                        className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] z-10"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                        <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center gap-4 max-w-sm mx-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden />
                            <div className="text-center space-y-1">
                                <h3 className="font-heading font-bold text-lg">Processando imagem</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isCompare
                                        ? 'Comparando dois modelos em paralelo. Aguarde.'
                                        : 'Enviando para o motor de análise Med Vision…'}
                                </p>
                                <p className="text-[11px] text-muted-foreground/90 pt-1">
                                    Dica: análises complexas podem levar até cerca de 2 minutos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mt-8 space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-primary flex items-center gap-2">
                            <Sparkles className="w-4 h-4" aria-hidden />
                            {progress < 25
                                ? 'Preparando imagem…'
                                : progress < 55
                                  ? 'Analisando achados…'
                                  : progress < 85
                                    ? 'Gerando laudo…'
                                    : 'Finalizando…'}
                        </span>
                        <span aria-hidden="true">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </motion.div>
        </div>
    )
}
