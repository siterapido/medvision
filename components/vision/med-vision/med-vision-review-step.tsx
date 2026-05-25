'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import ReactCrop, { type Crop as CropType, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { ChevronRight, Crop, Check, X, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { MedVisionStepIndicator } from '@/components/vision/med-vision/step-indicator'
import { MedVisionAnalysisSummary } from '@/components/vision/med-vision/med-vision-analysis-summary'
import { compressImageForAnalysis } from '@/lib/utils/image-quality-validator'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import type { VisionState } from '@/components/vision/med-vision/vision-wizard-state'
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <GlassCard className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Crop className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-heading font-bold">Ajustar região</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                            Opcional
                        </Badge>
                    </div>

                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/90 border border-border/50 flex items-center justify-center [&_.ReactCrop__crop-selection]:border-primary">
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
                                className="max-h-[50vh] object-contain"
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                            />
                        </ReactCrop>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                        <Button variant="outline" className="flex-1 h-11 rounded-xl gap-1.5" onClick={handleSkipCrop}>
                            <X className="w-4 h-4" /> Usar imagem inteira
                        </Button>
                        <Button className="flex-1 h-11 rounded-xl gap-1.5" onClick={handleCropConfirm}>
                            <Check className="w-4 h-4" /> Confirmar recorte
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
                        className="mt-2 w-full text-xs gap-1.5"
                    >
                        <RotateCcw className="w-3 h-3" /> Resetar área
                    </Button>

                    <p className="text-[11px] text-muted-foreground mt-3">Preview enviado:</p>
                    <div className="rounded-lg overflow-hidden border border-border/40 mt-1">
                        <img src={image} alt="Preview final" className="w-full object-contain max-h-[120px]" />
                    </div>
                </GlassCard>

                <MedVisionAnalysisSummary config={config} imageDataUrl={image} />
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2" onClick={onBack}>
                    <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                </Button>
                <Button
                    className="flex-1 h-12 rounded-xl gap-2 bg-primary font-semibold"
                    onClick={() => onAnalyze(image)}
                >
                    <Sparkles className="w-4 h-4" /> Analisar agora
                </Button>
            </div>
        </motion.div>
    )
}
