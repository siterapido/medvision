'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    WIZARD_STEPS,
    getVisionPhaseSubtitle,
    isWizardComplete,
    mapVisionStateToWizardStep,
    type VisionState,
} from '@/components/vision/med-vision/vision-wizard-state'

type MedVisionStepIndicatorProps = {
    state: VisionState
    className?: string
}

/**
 * Indicador linear dos 4 passos (Imagem → Problema → Ajustes → Confirmar).
 * Durante ANÁLISE, o passo "Confirmar" permanece destacado; em RESULT, todos aparecem concluídos.
 */
export function MedVisionStepIndicator({ state, className }: MedVisionStepIndicatorProps) {
    const stepKey = mapVisionStateToWizardStep(state)
    const allComplete = isWizardComplete(state)
    const idx = WIZARD_STEPS.findIndex((s) => s.key === stepKey)
    const phase = getVisionPhaseSubtitle(state)

    return (
        <div className={cn('mb-6 md:mb-8 space-y-2', className)}>
            <div className="flex items-center justify-center gap-0 flex-wrap">
                {WIZARD_STEPS.map((step, i) => {
                    const done = allComplete || i < idx
                    const active = !allComplete && i === idx
                    return (
                        <div key={step.key} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                                        done
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : active
                                              ? 'border-primary text-primary bg-primary/10'
                                              : 'border-border text-muted-foreground bg-muted/30',
                                    )}
                                >
                                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span
                                    className={cn(
                                        'text-[10px] font-medium hidden sm:block max-w-[4.5rem] text-center leading-tight',
                                        active || done ? 'text-primary' : 'text-muted-foreground',
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {i < WIZARD_STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'h-0.5 w-6 sm:w-10 mx-0.5 sm:mx-1 mb-4 sm:mb-5 transition-all',
                                        i < idx || allComplete ? 'bg-primary' : 'bg-border',
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
            {phase && (
                <p className="text-center text-[11px] text-muted-foreground max-w-md mx-auto px-2">{phase}</p>
            )}
        </div>
    )
}
