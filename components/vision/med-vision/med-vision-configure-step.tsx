'use client'

import { motion } from 'motion/react'
import { ChevronRight, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MedVisionStepIndicator } from '@/components/vision/med-vision/step-indicator'
import { MedVisionConfigForm } from '@/components/vision/med-vision/med-vision-config-form'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import type { ImageQualityResult } from '@/lib/utils/image-quality-validator'
import type { VisionState } from '@/components/vision/med-vision/vision-wizard-state'

type MedVisionConfigureStepProps = {
    state: VisionState
    originalImage: string | null
    config: MedVisionAnalysisConfig
    onConfigChange: (patch: Partial<MedVisionAnalysisConfig>) => void
    qualityResult: ImageQualityResult | null
    getRootProps: () => Record<string, unknown>
    getInputProps: () => Record<string, unknown>
    isDragActive: boolean
    onBack: () => void
    onContinue: () => void
}

export function MedVisionConfigureStep({
    state,
    originalImage,
    config,
    onConfigChange,
    qualityResult,
    getRootProps,
    getInputProps,
    isDragActive,
    onBack,
    onContinue,
}: MedVisionConfigureStepProps) {
    return (
        <motion.div
            key="configure"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full space-y-6"
        >
            <MedVisionStepIndicator state={state} />

            {!originalImage ? (
                <div {...getRootProps()} className="outline-none">
                    <div
                        className={cn(
                            'rounded-xl border border-border bg-card p-8 md:p-12 border-dashed border-2 cursor-pointer transition-colors text-center',
                            isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/40',
                        )}
                    >
                        <input {...getInputProps()} />
                        <FileUp className="w-10 h-10 text-primary mx-auto mb-4" />
                        <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
                        <p className="text-xs text-muted-foreground mt-1">Radiografia, TC ou foto clínica</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">Imagem selecionada</p>
                        <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                            <img
                                src={originalImage}
                                alt="Preview"
                                className="w-full object-contain max-h-[300px]"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 w-full text-xs"
                            onClick={onBack}
                        >
                            Trocar imagem
                        </Button>
                    </div>
                    <MedVisionConfigForm
                        config={config}
                        onChange={onConfigChange}
                        qualityWarnings={qualityResult?.warnings}
                    />
                </div>
            )}

            {originalImage && (
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl gap-2" onClick={onBack}>
                        <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                    </Button>
                    <Button className="flex-1 h-11 rounded-xl gap-2" onClick={onContinue}>
                        Revisar análise <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </motion.div>
    )
}
