'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import ReactCrop, { type Crop as CropType, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
    ChevronRight,
    ChevronDown,
    Crop,
    Check,
    X,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Scan,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MedVisionStepIndicator } from '@/components/vision/med-vision/step-indicator'
import { MedVisionAnalysisSummary } from '@/components/vision/med-vision/med-vision-analysis-summary'
import { VisionClinicalDisclaimer } from '@/components/vision/med-vision/clinical-disclaimer'
import { compressImageForAnalysis } from '@/lib/utils/image-quality-validator'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import type { VisionState } from '@/components/vision/med-vision/vision-wizard-state'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type MedVisionReviewStepProps = {
    state: VisionState
    originalImage: string
    image: string
    config: MedVisionAnalysisConfig
    onBack: () => void
    onAnalyze: (finalImage: string) => void
    onImageReady: (dataUrl: string) => void
}

const PANEL = 'rounded-xl border border-rule bg-surface-raised'

export function MedVisionReviewStep({
    state,
    originalImage,
    image,
    config,
    onBack,
    onAnalyze,
    onImageReady,
}: MedVisionReviewStepProps) {
    const [crop, setCrop] = useState<CropType>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [zoom, setZoom] = useState(1)
    const cropImgRef = useRef<HTMLImageElement>(null)

    const createCroppedImage = useCallback(
        async (pixelCrop: PixelCrop): Promise<string> => {
            const imgEl = cropImgRef.current
            if (!imgEl) throw new Error('Image ref not available')

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Could not get canvas context')

            const scaleX = imgEl.naturalWidth / (imgEl.width * zoom)
            const scaleY = imgEl.naturalHeight / (imgEl.height * zoom)

            const cropX = pixelCrop.x * scaleX
            const cropY = pixelCrop.y * scaleY
            const cropW = pixelCrop.width * scaleX
            const cropH = pixelCrop.height * scaleY

            canvas.width = cropW
            canvas.height = cropH
            ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
            return canvas.toDataURL('image/jpeg', 0.92)
        },
        [zoom],
    )

    const applyImage = useCallback(
        async (dataUrl: string) => {
            try {
                const compressed = await compressImageForAnalysis(dataUrl, 1024, 0.85)
                onImageReady(compressed)
            } catch {
                onImageReady(dataUrl)
            }
        },
        [onImageReady],
    )

    const handleSkipCrop = useCallback(async () => {
        await applyImage(originalImage)
    }, [applyImage, originalImage])

    const handleCropConfirm = useCallback(async () => {
        try {
            if (!completedCrop || completedCrop.width === 0) {
                await applyImage(originalImage)
                return
            }
            const cropped = await createCroppedImage(completedCrop)
            await applyImage(cropped)
        } catch (error) {
            console.error('Error cropping image:', error)
            toast.error('Erro ao recortar imagem')
        }
    }, [applyImage, completedCrop, createCroppedImage, originalImage])

    return (
        <motion.div
            key="review"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full space-y-6"
        >
            <MedVisionStepIndicator state={state} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className={cn(PANEL, 'p-4 sm:p-5 space-y-4')}>
                    <p className="text-xs font-medium text-ink-muted">Imagem para análise</p>
                    <div className="rounded-lg overflow-hidden border border-rule bg-surface">
                        <img
                            src={image}
                            alt="Imagem selecionada"
                            className="w-full object-contain max-h-[40vh]"
                        />
                    </div>

                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-rule bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-raised">
                            <span className="flex items-center gap-2">
                                <Crop className="w-4 h-4 text-signal shrink-0" />
                                Ajustar região
                                <Badge variant="outline" className="text-[10px] border-rule text-ink-muted">
                                    Opcional
                                </Badge>
                            </span>
                            <ChevronDown className="h-4 w-4 text-ink-muted" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3 space-y-4">
                            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-ink/90 border border-rule flex items-center justify-center [&_.ReactCrop__crop-selection]:border-signal">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    className="max-h-full"
                                >
                                    <img
                                        ref={cropImgRef}
                                        src={originalImage}
                                        alt="Imagem para recorte"
                                        className="max-h-[36vh] object-contain"
                                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                                    />
                                </ReactCrop>
                            </div>

                            <div className="flex items-center gap-3">
                                <ZoomOut className="w-4 h-4 text-ink-muted shrink-0" />
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={(value) => setZoom(value[0])}
                                    className="flex-1"
                                />
                                <ZoomIn className="w-4 h-4 text-ink-muted shrink-0" />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-10 rounded-lg gap-1.5 border-rule" onClick={handleSkipCrop}>
                                    <X className="w-4 h-4" /> Usar inteira
                                </Button>
                                <Button className="flex-1 h-10 rounded-lg gap-1.5 bg-signal text-surface-raised hover:bg-signal/90" onClick={handleCropConfirm}>
                                    <Check className="w-4 h-4" /> Confirmar
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setCrop(undefined)
                                    setCompletedCrop(undefined)
                                    setZoom(1)
                                }}
                                className="w-full text-xs gap-1.5 text-ink-muted"
                            >
                                <RotateCcw className="w-3 h-3" /> Resetar área
                            </Button>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                <MedVisionAnalysisSummary config={config} imageDataUrl={image} />
            </div>

            <VisionClinicalDisclaimer variant="compact" />

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 border-rule" onClick={onBack}>
                    <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                </Button>
                <Button
                    className="flex-1 h-12 rounded-xl gap-2 bg-signal text-surface-raised hover:bg-signal/90 font-semibold"
                    onClick={() => onAnalyze(image)}
                >
                    <Scan className="w-4 h-4" /> Analisar agora
                </Button>
            </div>
        </motion.div>
    )
}
