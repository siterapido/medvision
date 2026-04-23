'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import ReactCrop, { type Crop as CropType, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
    FileUp,
    Search,
    FileText,
    Scan,
    AlertCircle,
    CheckCircle2,
    Download,
    RefreshCcw,
    Maximize2,
    Image as ImageIcon,
    Loader2,
    ChevronRight,
    Sparkles,
    Info,
    AlertTriangle,
    Crop,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Check,
    X,
    Save,
    ExternalLink,
    Pencil,
    GitBranch,
    Tag,
    ChevronDown,
    ChevronUp,
    Microscope,
    MoreVertical,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getSeverityStyle } from '@/lib/constants/vision'
import { VisionAnalysisResult, VisionArtifactContent, VisionRefinement, BoundingBox, VisionComparisonResult } from '@/lib/types/vision'
import { ModelSelector } from '@/components/vision/model-selector'
import { MODELS, VISION_MODELS_LIST } from '@/lib/ai/openrouter'
import { VISION_SPECIALTIES, type VisionSpecialty } from '@/lib/constants/vision-specialties'

/** Segundo modelo para modo comparar (distinto do padrão). */
const DEFAULT_COMPARE_MODEL_B =
    VISION_MODELS_LIST.find(m => m.id !== MODELS.vision)?.id ?? MODELS.vision
import { ImageOverlay } from '@/components/vision/image-overlay'
import { QualityFeedback } from '@/components/vision/quality-feedback'
import { AnnotationToolbar } from '@/components/vision/annotation-toolbar'
import { AnnotationCanvas } from '@/components/vision/annotation-canvas'
import { RegionSelector } from '@/components/vision/region-selector'
import { Textarea } from '@/components/ui/textarea'
import { validateImageQuality, compressImageForAnalysis, ImageQualityResult } from '@/lib/utils/image-quality-validator'
import { useAnnotations } from '@/lib/hooks/use-annotations'
import { useSoundNotification } from '@/lib/hooks/use-sound-notification'
import { toast } from 'sonner'
import { generateVisionPDF } from '@/lib/utils/generate-vision-pdf'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AnalyzingStage,
    MedVisionStepIndicator,
    VisionClinicalDisclaimer,
    VisionErrorBanner,
    VisionErrorRecovery,
} from '@/components/vision/med-vision'
import type { VisionState } from '@/components/vision/med-vision'

export default function MedVisionPage() {
    const router = useRouter()
    const { playSuccess } = useSoundNotification()
    const [state, setState] = useState<VisionState>('UPLOAD')
    const [image, setImage] = useState<string | null>(null)
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null)
    const [analysisPrecision, setAnalysisPrecision] = useState<number | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPresentationMode, setIsPresentationMode] = useState(false)
    const [showHeatmap, setShowHeatmap] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [isComparing, setIsComparing] = useState(false)
    const [comparisonItems, setComparisonItems] = useState<VisionAnalysisResult[]>([])
    const [previousAnalyses, setPreviousAnalyses] = useState<{id: string; title: string; date: string; content: any}[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [clinicalContext, setClinicalContext] = useState('')
    const [specialty, setSpecialty] = useState<VisionSpecialty>('torax')

    // Model selection state
    const [analysisMode, setAnalysisMode] = useState<'single' | 'compare'>('single')
    const [selectedModel, setSelectedModel] = useState<string>(MODELS.vision)
    const [compareModelA, setCompareModelA] = useState<string>(MODELS.vision)
    const [compareModelB, setCompareModelB] = useState<string>(DEFAULT_COMPARE_MODEL_B)
    const [comparisonResult, setComparisonResult] = useState<VisionComparisonResult | null>(null)

    // Crop states
    const [crop, setCrop] = useState<CropType>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [zoom, setZoom] = useState(1)
    const cropImgRef = useRef<HTMLImageElement>(null)

    // Quality validation state
    const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null)

    // Annotation state
    const [isAnnotating, setIsAnnotating] = useState(false)
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const {
        annotations,
        currentAnnotation,
        activeTool,
        activeColor,
        canUndo,
        canRedo,
        setActiveTool,
        setActiveColor,
        startAnnotation,
        updateAnnotation,
        finishAnnotation,
        cancelAnnotation,
        undo,
        redo,
        clear: clearAnnotations,
    } = useAnnotations()

    // Refinement state
    const [isSelectingRegion, setIsSelectingRegion] = useState(false)
    const [refinements, setRefinements] = useState<VisionRefinement[]>([])
    const [isRefining, setIsRefining] = useState(false)
    const [expandedRefinement, setExpandedRefinement] = useState<number | null>(null)
    const [imageToolsExpanded, setImageToolsExpanded] = useState(false)

    // Generate thumbnail from image
    const generateThumbnail = useCallback(async (imageSrc: string, size: number = 200): Promise<string> => {
        const img = new Image()
        img.src = imageSrc
        await new Promise((resolve) => { img.onload = resolve })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        const aspectRatio = img.width / img.height
        let width = size
        let height = size
        if (aspectRatio > 1) { height = size / aspectRatio } else { width = size * aspectRatio }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        return canvas.toDataURL('image/jpeg', 0.7)
    }, [])

    // Internal save implementation
    const performSave = useCallback(async (
        imageSrc: string,
        analysisData: VisionAnalysisResult,
        currentAnnotations = annotations,
        currentRefinements: VisionRefinement[] = []
    ) => {
        const thumbnail = await generateThumbnail(imageSrc)
        const imageType = analysisData.meta?.imageType || 'Imagem'
        const date = new Date().toLocaleDateString('pt-BR')

        const content: VisionArtifactContent = {
            thumbnailBase64: thumbnail,
            imageBase64: imageSrc,
            analysis: analysisData,
            annotations: currentAnnotations,
            analyzedAt: new Date().toISOString(),
            refinements: currentRefinements,
        }

        const response = await fetch('/api/artifacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Laudo Vision: ${imageType} - ${date}`,
                description: analysisData.report?.diagnosticHypothesis?.slice(0, 200) || 'Análise de imagem (radiografia ou tomografia)',
                type: 'vision',
                content
            })
        })

        if (!response.ok) throw new Error('Falha ao salvar')
    }, [annotations, generateThumbnail])

    // Manual save triggered by user button
    const saveToLibrary = useCallback(async () => {
        if (!analysisResult || !image || isSaving || isSaved) return

        setIsSaving(true)
        try {
            await performSave(image, analysisResult, annotations, refinements)
            setIsSaved(true)
            toast.success('Salvo na biblioteca!', {
                action: {
                    label: 'Ver na Biblioteca',
                    onClick: () => router.push('/dashboard/biblioteca')
                }
            })
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Erro ao salvar na biblioteca')
        } finally {
            setIsSaving(false)
        }
    }, [analysisResult, image, isSaving, isSaved, annotations, refinements, performSave, router])

    const readImageAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (err) => reject(err)
        })
    }

    const createCroppedImage = useCallback(async (pixelCrop: PixelCrop): Promise<string> => {
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
        return canvas.toDataURL('image/jpeg', 0.95)
    }, [zoom])

    // Crop a region from an existing base64 image by percentage coords
    const cropRegionFromImage = useCallback(async (imageSrc: string, box: BoundingBox): Promise<string> => {
        const img = new Image()
        img.src = imageSrc
        await new Promise((resolve) => { img.onload = resolve })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        const cropX = (box.xmin / 100) * img.naturalWidth
        const cropY = (box.ymin / 100) * img.naturalHeight
        const cropW = ((box.xmax - box.xmin) / 100) * img.naturalWidth
        const cropH = ((box.ymax - box.ymin) / 100) * img.naturalHeight

        canvas.width = cropW
        canvas.height = cropH
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
        return canvas.toDataURL('image/jpeg', 0.92)
    }, [])

    const handleCropConfirm = useCallback(async () => {
        if (!originalImage) return

        if (!completedCrop || completedCrop.width === 0) {
            setImage(originalImage)
            setState('CONFIRM')
            return
        }

        try {
            const croppedImage = await createCroppedImage(completedCrop)
            setImage(croppedImage)
            setState('CONFIRM')
        } catch (error) {
            console.error('Error cropping image:', error)
            toast.error('Erro ao recortar imagem')
        }
    }, [originalImage, completedCrop, createCroppedImage])

    const handleSkipCrop = useCallback(() => {
        if (!originalImage) return
        setImage(originalImage)
        setState('CONFIRM')
    }, [originalImage])

    const resetCrop = useCallback(() => {
        setCrop(undefined)
        setCompletedCrop(undefined)
        setZoom(1)
    }, [])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            try {
                const imageBase64 = await readImageAsBase64(file)
                const compressed = await compressImageForAnalysis(imageBase64, 1280, 0.88)
                setOriginalImage(compressed)
                setImage(compressed)
                const result = await validateImageQuality(compressed)
                setQualityResult(result)
                setState('DESCRIBE')
                resetCrop()
            } catch (error) {
                console.error("Error processing image:", error)
                toast.error("Erro ao processar imagem. Tente outro arquivo.")
                setState('UPLOAD')
            }
        }
    }, [resetCrop])

    const handleValidationProceed = useCallback(() => {
        setState('DESCRIBE')
        resetCrop()
    }, [resetCrop])

    const handleValidationCancel = useCallback(() => {
        setOriginalImage(null)
        setImage(null)
        setQualityResult(null)
        setState('UPLOAD')
    }, [])

    const getModelName = (modelId: string) =>
        VISION_MODELS_LIST.find(m => m.id === modelId)?.name ?? modelId

    const startSingleAnalysis = async (imageData: string, modelId: string) => {
        setState('ANALYZING')
        setProgress(0)
        setAnalysisResult(null)
        setAnalysisPrecision(null)
        setComparisonResult(null)

        // Progress com desaceleração natural — não trava mais nos 90%
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev
                // Incremento diminui conforme avança: rápido no início, lento no fim
                const increment = prev < 30 ? 4 : prev < 60 ? 3 : prev < 80 ? 1.5 : 0.5
                return Math.min(95, prev + increment)
            })
        }, 500)

        try {
            const response = await fetch('/api/vision/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, clinicalContext: clinicalContext || undefined, model: modelId, specialty })
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                if (response.status === 401) {
                    clearInterval(interval)
                    router.push('/login')
                    return
                }
                if (response.status === 402 || errData?.error === 'credits_exhausted') {
                    throw new Error('Créditos insuficientes. Você atingiu o limite mensal do seu plano. Faça upgrade para continuar.')
                }
                if (response.status === 429) {
                    const limit = errData?.limit
                    const used = errData?.used
                    const limitInfo = limit ? ` (${used}/${limit} hoje)` : ''
                    throw new Error(errData?.error || `Limite diário atingido${limitInfo}. Faça upgrade para Pro.`)
                }
                if (response.status === 413) {
                    throw new Error('Imagem muito grande. Tente comprimir ou usar uma imagem menor.')
                }
                if (response.status === 504) {
                    throw new Error('Tempo excedido. Tente com uma imagem menor ou tente novamente.')
                }

                // Extrai mensagem estruturada da API com fallbacks
                const errorCode = errData?.error?.code
                const errorMessage = errData?.error?.message
                const errorDetail = errData?.details

                // Mapeia códigos conhecidos para mensagens amigáveis
                const errorMessages: Record<string, string> = {
                    'VISION_PROVIDER_AUTH': 'Erro de configuração. Contate o suporte.',
                    'VISION_RATE_LIMIT': 'Muitas requisições. Aguarde um momento e tente novamente.',
                    'VISION_PROVIDER_UNAVAILABLE': 'Serviço de IA temporariamente indisponível. Tente novamente em instantes.',
                    'VISION_TIMEOUT': 'Tempo excedido ao analisar. Tente com uma imagem menor.',
                    'VISION_NETWORK': 'Erro de conexão. Verifique sua internet.',
                    'VISION_PARSE_ERROR': 'Erro ao processar resposta. Tente novamente.',
                }

                const friendlyMsg = errorCode ? errorMessages[errorCode] : null
                const errorMsg = friendlyMsg || errorMessage || errorDetail || errData?.error || `Falha na análise (${response.status})`
                throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Falha ao analisar imagem')
            }

            const data = await response.json() as VisionAnalysisResult & { precision?: number }
            clearInterval(interval)
            setProgress(100)
            setAnalysisResult(data)
            setAnalysisPrecision(data.precision ?? null)

            performSave(imageData, data, []).then(() => {
                setIsSaved(true)
            }).catch((err) => {
                console.warn('Auto-save failed:', err)
            })

            setTimeout(() => { setState('RESULT'); playSuccess() }, 500)

        } catch (error) {
            clearInterval(interval)
            console.error(error)
            const msg = error instanceof Error ? error.message : 'Erro desconhecido'
            toast.error(`Erro na análise: ${msg}`)
            setState('ERROR')
        }
    }

    // Helper to retry analysis with exponential backoff
    const retryAnalysis = async (
        imageData: string,
        modelId: string,
        maxRetries = 2
    ): Promise<VisionAnalysisResult | null> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch('/api/vision/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: imageData,
                        clinicalContext: clinicalContext || undefined,
                        model: modelId,
                        specialty
                    })
                })

                if (!response.ok) {
                    // Non-retryable errors
                    if (response.status === 401 || response.status === 402 || response.status === 413) {
                        const errData = await response.json().catch(() => ({}))
                        throw new Error(errData?.error || `Erro ${response.status}`)
                    }
                    // Retryable but max retries reached
                    if (attempt >= maxRetries) {
                        throw new Error(`Falha após ${maxRetries} tentativas`)
                    }
                    // Wait and retry
                    const delay = Math.pow(2, attempt) * 1000
                    await new Promise(r => setTimeout(r, delay))
                    continue
                }

                return await response.json() as VisionAnalysisResult & { precision?: number }
            } catch (e) {
                if (attempt >= maxRetries) {
                    throw e
                }
                const delay = Math.pow(2, attempt) * 1000
                await new Promise(r => setTimeout(r, delay))
            }
        }
        return null
    }

    const startCompareAnalysis = async (imageData: string, modelA: string, modelB: string) => {
        setState('ANALYZING')
        setProgress(0)
        setAnalysisResult(null)
        setAnalysisPrecision(null)
        setComparisonResult(null)

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev
                const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.3
                return Math.min(95, prev + increment)
            })
        }, 500)

        try {
            const headers = { 'Content-Type': 'application/json' }
            const [resA, resB] = await Promise.all([
                fetch('/api/vision/analyze', {
                    method: 'POST', headers,
                    body: JSON.stringify({ image: imageData, clinicalContext: clinicalContext || undefined, model: modelA, specialty })
                }),
                fetch('/api/vision/analyze', {
                    method: 'POST', headers,
                    body: JSON.stringify({ image: imageData, clinicalContext: clinicalContext || undefined, model: modelB, specialty })
                }),
            ])

            if (!resA.ok || !resB.ok) {
                const failed = !resA.ok ? resA : resB
                const errData = await failed.json().catch(() => ({}))
                if (failed.status === 401) {
                    clearInterval(interval)
                    router.push('/login')
                    return
                }
                if (failed.status === 402 || errData?.error === 'credits_exhausted') {
                    throw new Error('Créditos insuficientes. Você atingiu o limite mensal do seu plano. Faça upgrade para continuar.')
                }
                if (failed.status === 429) {
                    const limit = errData?.limit
                    const used = errData?.used
                    const limitInfo = limit ? ` (${used}/${limit} hoje)` : ''
                    throw new Error(errData?.error || `Limite diário atingido${limitInfo}. Faça upgrade para Pro.`)
                }
                throw new Error(errData?.error || `HTTP ${failed.status}`)
            }

            const [dataA, dataB] = await Promise.all([
                resA.json() as Promise<VisionAnalysisResult & { precision?: number }>,
                resB.json() as Promise<VisionAnalysisResult & { precision?: number }>,
            ])

            clearInterval(interval)
            setProgress(100)

            setComparisonResult({
                modelA: { modelId: modelA, modelName: getModelName(modelA), result: dataA, precision: dataA.precision ?? null },
                modelB: { modelId: modelB, modelName: getModelName(modelB), result: dataB, precision: dataB.precision ?? null },
            })

            // Auto-save model A result as the canonical artifact
            performSave(imageData, dataA, []).then(() => {
                setIsSaved(true)
            }).catch((err) => {
                console.warn('Auto-save failed:', err)
            })

            setTimeout(() => { setState('RESULT'); playSuccess() }, 500)

        } catch (error) {
            clearInterval(interval)
            console.error(error)
            const msg = error instanceof Error ? error.message : 'Erro desconhecido'
            toast.error(`Erro ao comparar modelos: ${msg}. Tente novamente.`)
            setState('ERROR')
        }
    }

    const startAnalysis = (imageData: string) => {
        if (analysisMode === 'compare') {
            startCompareAnalysis(imageData, compareModelA, compareModelB)
        } else {
            startSingleAnalysis(imageData, selectedModel)
        }
    }

    // Handle region refinement
    const handleRegionSelected = useCallback(async (box: BoundingBox) => {
        if (!image || !analysisResult) return

        setIsSelectingRegion(false)
        setIsRefining(true)

        try {
            const regionImage = await cropRegionFromImage(image, box)

            // Build summary of original analysis for context
            const findingsSummary = analysisResult.findings.map(f => `${f.type} (${f.level})`).join(', ') || 'Nenhum achado relevante'
            const originalAnalysisSummary = `Tipo: ${analysisResult.meta?.imageType || 'N/A'}. Achados: ${findingsSummary}. Hipótese: ${analysisResult.report?.diagnosticHypothesis?.slice(0, 200) || 'N/A'}`

            const response = await fetch('/api/vision/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: regionImage,
                    clinicalContext: clinicalContext || undefined,
                    mode: 'refine',
                    originalAnalysisSummary,
                    specialty,
                })
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData?.error || `HTTP ${response.status}`)
            }

            const refinedData = await response.json() as VisionAnalysisResult & { precision?: number }

            const newRefinement: VisionRefinement = {
                regionBox: box,
                regionImageBase64: regionImage,
                analysis: refinedData,
                analyzedAt: new Date().toISOString(),
            }

            setRefinements(prev => {
                const updated = [...prev, newRefinement]
                setExpandedRefinement(updated.length - 1) // auto-expand the new one
                return updated
            })
toast.success('Região re-analisada com sucesso!')
            setState('RESULT')
            playSuccess()
        } catch (err) {
            toast.error(`Erro ao refinar região: ${err}`)
        } finally {
            setIsRefining(false)
        }
    }, [image, analysisResult, clinicalContext, cropRegionFromImage])

    const removeRefinement = useCallback((index: number) => {
        setRefinements(prev => prev.filter((_, i) => i !== index))
        setExpandedRefinement(prev => prev === index ? null : prev !== null && prev > index ? prev - 1 : prev)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    })

    const reset = () => {
        setState('UPLOAD')
        setImage(null)
        setOriginalImage(null)
        setProgress(0)
        setAnalysisResult(null)
        setAnalysisPrecision(null)
        setIsSaved(false)
        setIsSaving(false)
        setQualityResult(null)
        setIsAnnotating(false)
        setIsSelectingRegion(false)
        setRefinements([])
        setExpandedRefinement(null)
        setClinicalContext('')
        setComparisonResult(null)
        setImageToolsExpanded(false)
        clearAnnotations()
        resetCrop()
    }

    return (
        <div className="pb-4 pt-4 px-3 md:pb-20 md:pt-6 md:px-8 max-w-6xl mx-auto w-full min-w-0">
            {/* Header */}
            <header className="mb-5 md:mb-10 space-y-1.5">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 md:p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Scan className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground">
                        Med Vision
                    </h1>
                </div>
                <p className="text-muted-foreground text-xs md:text-base max-w-2xl">
                    Envie radiografias ou fotos intraorais para uma análise profunda assistida por inteligência artificial.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8 min-w-0">
                <AnimatePresence mode="wait">
                    {/* ─── UPLOAD / ERROR ─── */}
                    {(state === 'UPLOAD' || state === 'ERROR') && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <MedVisionStepIndicator state={state} />

                            {state === 'ERROR' && <VisionErrorBanner />}

                            {state === 'ERROR' && (
                                <div className="mb-6">
                                    <VisionErrorRecovery
                                        hasImage={Boolean(image)}
                                        onRetryFromConfirm={() => setState('CONFIRM')}
                                        onChangeModel={() => setState('CROP')}
                                        onBackToCrop={() => setState('CROP')}
                                        onNewUpload={reset}
                                    />
                                </div>
                            )}

                            <GlassCard className="p-6 md:p-12 border-dashed border-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 transition-all duration-500 min-h-[260px] md:min-h-[400px]"
                                {...getRootProps()}
                            >
                                <input {...getInputProps()} />
                                <div className="relative mb-4 md:mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative h-14 w-14 md:h-20 md:w-20 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 group-hover:scale-110 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-500">
                                        <FileUp className="h-7 w-7 md:h-10 md:w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-xl font-medium mb-1.5 md:mb-2 group-hover:text-primary transition-colors">
                                    {isDragActive ? 'Solte a imagem agora' : 'Arraste e solte sua imagem'}
                                </h3>
                                <p className="text-muted-foreground text-sm md:text-base max-w-xs mx-auto mb-5 md:mb-8">
                                    Suporta radiografias periapicais, panorâmicas e fotos clínicas (PNG, JPG).
                                </p>
                                <Button variant="outline" className="rounded-full px-6 md:px-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                    Selecionar arquivo
                                </Button>
                            </GlassCard>

                            {/* Tips Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                {[
                                    { icon: Info, title: 'Alta Resolução', desc: 'Imagens nítidas garantem mais precisão na detecção.' },
                                    { icon: ImageIcon, title: 'Enquadramento', desc: 'Centralize a área de interesse para melhor análise.' },
                                    { icon: CheckCircle2, title: 'Segurança', desc: 'Dados criptografados e conformidade com LGPD.' },
                                ].map((tip, i) => (
                                    <GlassCard key={i} className="p-4 flex gap-4 items-start bg-muted/20 border-border/30">
                                        <tip.icon className="w-5 h-5 text-primary shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold">{tip.title}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STEP 2: DESCRIBE ─── */}
                    {state === 'DESCRIBE' && originalImage && (
                        <motion.div
                            key="describe"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="w-full space-y-6"
                        >
                            <MedVisionStepIndicator state={state} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Image preview */}
                                <GlassCard className="p-4">
                                    <p className="text-xs text-muted-foreground mb-3 font-medium">Imagem selecionada</p>
                                    <div className="rounded-xl overflow-hidden border border-border/40 bg-black/20">
                                        <img src={originalImage} alt="Preview" className="w-full object-contain max-h-[300px]" />
                                    </div>
                                </GlassCard>

                                {/* Specialty + Clinical context */}
                                <div className="space-y-4">
                                    {/* Specialty selector */}
                                    <GlassCard className="p-5 border-border/40">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                                                <Microscope className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold">Especialidade</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">Selecione o tipo de análise para um laudo mais preciso.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(Object.values(VISION_SPECIALTIES) as typeof VISION_SPECIALTIES[VisionSpecialty][]).map((s) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setSpecialty(s.id)}
                                                    className={cn(
                                                        'flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all',
                                                        specialty === s.id
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                                                    )}
                                                >
                                                    <span className="text-xs font-semibold">{s.label}</span>
                                                    <span className="text-[10px] leading-tight opacity-80">{s.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </GlassCard>

                                    {/* Clinical context */}
                                    <GlassCard className="p-5 border-border/40">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold">Descreva o Problema</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">Informe queixa principal, histórico ou suspeita — a IA usará isso para personalizar o laudo.</p>
                                            </div>
                                        </div>
                                        <Textarea
                                            value={clinicalContext}
                                            onChange={(e) => setClinicalContext(e.target.value)}
                                            placeholder="Ex: Paciente com tosse persistente há 3 semanas, febre e dispneia. Suspeita de pneumonia lobar."
                                            className="resize-none text-sm h-28 bg-muted/20 border-border/40 focus:border-primary/50"
                                            maxLength={500}
                                        />
                                        {clinicalContext.length > 0 && (
                                            <p className="text-[10px] text-muted-foreground text-right mt-1">{clinicalContext.length}/500</p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-3 italic">Campo opcional — pule se preferir.</p>
                                    </GlassCard>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1 h-11 rounded-xl gap-2" onClick={() => setState('UPLOAD')}>
                                    <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                                </Button>
<Button className="flex-1 h-11 rounded-xl gap-2" onClick={() => { setState('CROP'); resetCrop() }}>
                            Próximo <ChevronRight className="w-4 h-4" />
                        </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── VALIDATING ─── */}
                    {state === 'VALIDATING' && originalImage && qualityResult && (
                        <motion.div
                            key="validating"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="w-full space-y-6"
                        >
                            <MedVisionStepIndicator state={state} />
                            <QualityFeedback
                                result={qualityResult}
                                imagePreview={originalImage}
                                onProceed={handleValidationProceed}
                                onCancel={handleValidationCancel}
                            />
                        </motion.div>
                    )}

                    {/* ─── CROP / ADJUST ─── */}
                    {state === 'CROP' && originalImage && (
                        <motion.div
                            key="crop"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="w-full space-y-6"
                        >
                            <MedVisionStepIndicator state={state} />

                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                            <Crop className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-heading font-bold">Recortar Imagem</h3>
                                            <p className="text-xs text-muted-foreground">Ajuste a área de interesse para melhor análise</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                                </div>

                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/90 border border-border/50 flex items-center justify-center [&_.ReactCrop]:max-h-full [&_.ReactCrop]:max-w-full [&_.ReactCrop__crop-selection]:border-primary [&_.ReactCrop__crop-selection]:border-2 [&_.ReactCrop__drag-handle]:bg-primary [&_.ReactCrop__drag-handle]:w-3 [&_.ReactCrop__drag-handle]:h-3 [&_.ReactCrop__drag-handle]:rounded-sm">
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
                                            className="max-h-[60vh] object-contain"
                                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                                        />
                                    </ReactCrop>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <ZoomOut className="w-4 h-4 text-muted-foreground" />
                                        <Slider
                                            value={[zoom]}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            onValueChange={(value) => setZoom(value[0])}
                                            className="flex-1"
                                        />
                                        <ZoomIn className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(zoom * 100)}%</span>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetCrop}
                                            className="text-xs gap-2"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Resetar
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 pt-4 border-t border-border/30">
                                    <Button variant="outline" className="h-12 rounded-xl gap-2 px-4" onClick={() => setState('CROP')}>
                                        <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2" onClick={handleSkipCrop}>
                                        <X className="w-4 h-4" /> Pular
                                    </Button>
                                    <Button className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90" onClick={handleCropConfirm}>
                                        <Check className="w-4 h-4" /> Confirmar
                                    </Button>
                                </div>
                            </GlassCard>

                            {qualityResult && qualityResult.warnings.length > 0 && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-500">Imagem com qualidade reduzida</p>
                                        <ul className="mt-1.5 space-y-0.5">
                                            {qualityResult.warnings.map((w, i) => (
                                                <li key={i} className="text-xs text-muted-foreground">• {w.message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── STEP 5: CONFIRM ─── */}
                    {state === 'CONFIRM' && image && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="w-full space-y-6"
                        >
                            <MedVisionStepIndicator state={state} />

                            <GlassCard className="p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                        <Microscope className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-heading font-bold">Confirmar Análise</h3>
                                        <p className="text-xs text-muted-foreground">Revise as configurações antes de iniciar.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Image preview */}
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-2">Imagem a analisar</p>
                                        <div className="rounded-xl overflow-hidden border border-border/40 bg-black/20">
                                            <img src={image} alt="Preview final" className="w-full object-contain max-h-[240px]" />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                                            <p className="text-[11px] text-muted-foreground font-medium mb-1">Modelo</p>
                                            {analysisMode === 'compare' ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold">{getModelName(compareModelA)}</p>
                                                    <p className="text-xs text-muted-foreground">vs</p>
                                                    <p className="text-sm font-semibold">{getModelName(compareModelB)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-semibold">{getModelName(selectedModel)}</p>
                                            )}
                                        </div>

                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                                            <p className="text-[11px] text-muted-foreground font-medium mb-1">Contexto clínico</p>
                                            {clinicalContext ? (
                                                <p className="text-sm leading-snug line-clamp-3">{clinicalContext}</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Não informado</p>
                                            )}
                                        </div>

                                        {analysisMode === 'compare' && (
                                            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-amber-400 leading-snug">Comparação consome 2 análises do seu limite diário.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2" onClick={() => setState('CROP')}>
                                    <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                                </Button>
                                <Button className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90 font-semibold text-base" onClick={() => startAnalysis(image)}>
                                    <Sparkles className="w-4 h-4" /> Analisar Agora
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── ANALYZING ─── */}
                    {state === 'ANALYZING' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="w-full"
                        >
                            <AnalyzingStage
                                state={state}
                                image={image}
                                progress={progress}
                                isCompare={analysisMode === 'compare'}
                            />
                        </motion.div>
                    )}

                    {/* ─── RESULT: Comparison Mode ─── */}
                    {state === 'RESULT' && analysisMode === 'compare' && comparisonResult && (
                        <motion.div
                            key="result-compare"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-6 max-w-6xl mx-auto w-full min-w-0"
                        >
                            <VisionClinicalDisclaimer />
                            {/* Header */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-heading font-bold">Comparação de Modelos</h2>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>
                                        {comparisonResult.modelA.result.detections.length} detecções ({comparisonResult.modelA.modelName})
                                    </span>
                                    <span>vs</span>
                                    <span>
                                        {comparisonResult.modelB.result.detections.length} detecções ({comparisonResult.modelB.modelName})
                                    </span>
                                </div>
                            </div>

                            {/* Side-by-side columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {([
                                    { side: comparisonResult.modelA, letter: 'A' },
                                    { side: comparisonResult.modelB, letter: 'B' },
                                ] as const).map(({ side, letter }) => (
                                    <div key={letter} className="flex flex-col gap-4">
                                        {/* Model badge */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className="text-xs px-2 py-0.5">Modelo {letter}</Badge>
                                            <span className="text-sm font-semibold">{side.modelName}</span>
                                            {side.precision !== null && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn('text-[10px] h-5 px-1.5 font-bold',
                                                        side.precision >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                            : side.precision >= 60 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                                : 'bg-red-500/10 text-red-400 border-red-400/30'
                                                    )}
                                                >
                                                    Precisão {side.precision}%
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Image overlay */}
                                        <GlassCard className="p-1 overflow-hidden min-w-0">
                                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/5 min-w-0">
                                                {image && (
                                                    <ImageOverlay
                                                        src={image}
                                                        detections={side.result.detections}
                                                        showConfidenceFilter
                                                    />
                                                )}
                                            </div>
                                        </GlassCard>

                                        {/* Findings */}
                                        <GlassCard className="p-4 space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Achados ({side.result.findings.length})
                                            </h4>
                                            {side.result.findings.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">Nenhum achado detectado.</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {side.result.findings.slice(0, 5).map((f, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/20 text-xs">
                                                            <span className="font-medium truncate mr-2">{f.type}</span>
                                                            <Badge variant="outline" className={cn('shrink-0 text-[9px] h-4 px-1', f.color.replace('text-', 'text-'))}>
                                                                {f.level}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {side.result.findings.length > 5 && (
                                                        <p className="text-[10px] text-muted-foreground">+{side.result.findings.length - 5} achados</p>
                                                    )}
                                                </div>
                                            )}
                                        </GlassCard>

                                        {/* Diagnostic hypothesis */}
                                        {side.result.report?.diagnosticHypothesis && (
                                            <GlassCard className="p-4">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Hipótese Diagnóstica</h4>
                                                <p className="text-xs leading-relaxed">{side.result.report.diagnosticHypothesis}</p>
                                            </GlassCard>
                                        )}

                                        {/* Recommendations */}
                                        {side.result.report?.recommendations && side.result.report.recommendations.length > 0 && (
                                            <GlassCard className="p-4">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Recomendações</h4>
                                                <ol className="space-y-1">
                                                    {side.result.report.recommendations.slice(0, 4).map((rec, i) => (
                                                        <li key={i} className="flex gap-2 text-xs">
                                                            <span className="shrink-0 text-primary font-semibold">{i + 1}.</span>
                                                            <span className="leading-relaxed">{rec}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </GlassCard>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full min-w-0">
                                <Button variant="outline" className="w-full rounded-xl h-12 gap-2" onClick={reset}>
                                    <RefreshCcw className="w-4 h-4" /> Analisar Outra
                                </Button>
                                <Button
                                    className="w-full rounded-xl h-12 gap-2 bg-primary hover:bg-primary/90"
                                    onClick={() => {
                                        if (comparisonResult && image) {
                                            toast.promise(
                                                generateVisionPDF({ analysisResult: comparisonResult.modelA.result, imageBase64: image, refinements }),
                                                { loading: 'Gerando PDF (Modelo A)...', success: 'PDF gerado!', error: 'Erro ao gerar PDF' }
                                            )
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4" /> Exportar PDF (Modelo A)
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RESULT: Single Mode ─── */}
                    {state === 'RESULT' && analysisMode === 'single' && analysisResult && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-8 max-w-4xl mx-auto w-full min-w-0"
                        >
                            <VisionClinicalDisclaimer />
                            {/* Quality badge (high precision) */}
                            {analysisPrecision !== null && analysisPrecision >= 80 && analysisResult.meta && (
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-[10px] text-muted-foreground">Qualidade da imagem:</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                        {analysisResult.meta.quality} · {analysisPrecision}%
                                    </span>
                                </div>
                            )}

                            {/* Precision/Quality Banner */}
                            {analysisPrecision !== null && analysisPrecision < 80 && (
                                <div className={cn(
                                    "p-4 rounded-xl border flex flex-col gap-3 sm:flex-row sm:items-start",
                                    analysisPrecision >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"
                                )}>
                                    <AlertTriangle className={cn("w-5 h-5 shrink-0 sm:mt-0.5", analysisPrecision >= 60 ? "text-amber-500" : "text-red-400")} />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <p className={cn("text-sm font-semibold break-words", analysisPrecision >= 60 ? "text-amber-500" : "text-red-400")}>
                                            Análise com precisão {analysisPrecision >= 60 ? 'limitada' : 'reduzida'} ({analysisPrecision}%)
                                        </p>
                                        {analysisResult.meta && (
                                            <span className={cn("inline-flex w-fit max-w-full text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", analysisPrecision >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-red-500/10 text-red-400 border-red-400/30")}>
                                                Qualidade: {analysisResult.meta.quality}
                                            </span>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {analysisPrecision < 60
                                                ? 'A qualidade da imagem está abaixo do recomendado. Confirme com uma imagem de melhor qualidade.'
                                                : 'A qualidade pode afetar a confiabilidade de alguns achados.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Image with Detections */}
                            <div className="space-y-4">
                                <GlassCard className="p-1 overflow-hidden min-w-0">
                                    <div
                                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-black/5 min-w-0"
                                        ref={(el) => {
                                            if (el && (el.offsetWidth !== imageSize.width || el.offsetHeight !== imageSize.height)) {
                                                setImageSize({ width: el.offsetWidth, height: el.offsetHeight })
                                            }
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {image && (
                                                <ImageOverlay
                                                    src={image}
                                                    detections={analysisResult.detections}
                                                    annotations={annotations}
                                                    showHeatmap={showHeatmap}
                                                    showConfidenceFilter
                                                    reserveMobileToolbarSlot
                                                    useModernMarkers
                                                />
                                            )}
                                        </div>

                                        {/* Annotation Canvas */}
                                        {isAnnotating && imageSize.width > 0 && (
                                            <>
                                                <div className="absolute inset-0">
                                                    <AnnotationCanvas
                                                        width={imageSize.width}
                                                        height={imageSize.height}
                                                        annotations={annotations}
                                                        currentAnnotation={currentAnnotation}
                                                        activeTool={activeTool}
                                                        activeColor={activeColor}
                                                        isDrawing={!!currentAnnotation}
                                                        onStartDrawing={startAnnotation}
                                                        onDraw={updateAnnotation}
                                                        onEndDrawing={finishAnnotation}
                                                        onCancelDrawing={cancelAnnotation}
                                                    />
                                                </div>
                                                <AnnotationToolbar
                                                    activeTool={activeTool}
                                                    activeColor={activeColor}
                                                    canUndo={canUndo}
                                                    canRedo={canRedo}
                                                    onToolChange={setActiveTool}
                                                    onColorChange={setActiveColor}
                                                    onUndo={undo}
                                                    onRedo={redo}
                                                    onClear={clearAnnotations}
                                                    onClose={() => setIsAnnotating(false)}
                                                />
                                            </>
                                        )}

                                        {/* Region Selector */}
                                        {isSelectingRegion && !isAnnotating && (
                                            <RegionSelector
                                                onRegionSelected={handleRegionSelected}
                                                onCancel={() => setIsSelectingRegion(false)}
                                            />
                                        )}

                                        {/* Refining overlay */}
                                        {isRefining && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                <div className="bg-background/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-border shadow-xl flex flex-col items-center gap-3">
                                                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                                                    <div className="text-center">
                                                        <p className="font-bold text-sm">Re-analisando Região</p>
                                                        <p className="text-xs text-muted-foreground">Análise focada em andamento...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action buttons — desktop: ícones; mobile: menu compacto */}
                                        {!isAnnotating && !isSelectingRegion && !isRefining && (
                                            <>
                                                <div className="md:hidden absolute bottom-2 right-2 z-30">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/70 rounded-full h-10 w-10"
                                                                aria-label="Ferramentas da imagem"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52">
                                                            <DropdownMenuItem onClick={() => setIsAnnotating(true)}>
                                                                <Pencil className="w-4 h-4 mr-2" /> Anotar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setIsSelectingRegion(true)}>
                                                                <Microscope className="w-4 h-4 mr-2" /> Refinar região
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setShowHeatmap(!showHeatmap)}>
                                                                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill={showHeatmap ? "#ef4444" : "none"} />
                                                                        <circle cx="12" cy="12" r="4" fill={showHeatmap ? "#fca5a5" : "none"} />
                                                                    </svg>
                                                                </span>
                                                                Mapa de calor {showHeatmap ? '(ligado)' : '(desligado)'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setIsPresentationMode(!isPresentationMode)}>
                                                                <span className="mr-2 text-xs">{isPresentationMode ? '✓' : '○'}</span>
                                                                Modo apresentação
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setIsFullscreen(true)}>
                                                                <Maximize2 className="w-4 h-4 mr-2" /> Tela cheia
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="hidden md:flex absolute bottom-4 right-4 gap-2 flex-nowrap shrink-0 items-center">
                                                    {!imageToolsExpanded ? (
                                                        <Button
                                                            variant="secondary"
                                                            className="bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/70 rounded-full h-10 px-3 gap-2 text-xs font-medium"
                                                            onClick={() => setImageToolsExpanded(true)}
                                                            title="Mostrar anotar, mapa de calor e mais"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                            Ferramentas da imagem
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0"
                                                                onClick={() => {
                                                                    setImageToolsExpanded(true)
                                                                    setIsAnnotating(true)
                                                                }}
                                                                title="Anotar"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0"
                                                                onClick={() => {
                                                                    setImageToolsExpanded(true)
                                                                    setIsSelectingRegion(true)
                                                                }}
                                                                title="Refinar região"
                                                            >
                                                                <Microscope className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className={cn(
                                                                    "bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0",
                                                                    showHeatmap && "bg-red-500/50 border-red-500/50"
                                                                )}
                                                                onClick={() => setShowHeatmap(!showHeatmap)}
                                                                title="Mapa de calor"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill={showHeatmap ? "#ef4444" : "none"} />
                                                                    <circle cx="12" cy="12" r="4" fill={showHeatmap ? "#fca5a5" : "none"} />
                                                                </svg>
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className={cn(
                                                                    "bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0",
                                                                    isPresentationMode && "bg-primary/70 border-primary"
                                                                )}
                                                                onClick={() => setIsPresentationMode(!isPresentationMode)}
                                                                title="Modo apresentação (paciente)"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                                                    <path d="M8 21h8M12 17v4" />
                                                                </svg>
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0"
                                                                onClick={() => setIsFullscreen(true)}
                                                                title="Tela cheia"
                                                            >
                                                                <Maximize2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full shrink-0 h-8 w-8"
                                                                onClick={() => setImageToolsExpanded(false)}
                                                                title="Ocultar barra de ferramentas"
                                                            >
                                                                <ChevronDown className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </GlassCard>

                                {/* Tip for clickable balloons */}
                                {analysisResult.detections.length > 0 && (
                                    <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                                        <Info className="w-3 h-3" />
                                        Clique nos balões de detecção para ver detalhes técnicos completos
                                    </p>
                                )}

                                {/* No findings state */}
                                {analysisResult.detections.length === 0 && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-500">Sem achados significativos</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">A análise não identificou patologias ou achados com confiança suficiente nesta imagem.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full min-w-0">
                                    <Button variant="outline" className="w-full rounded-xl h-12 gap-2" onClick={reset}>
                                        <RefreshCcw className="w-4 h-4" /> Analisar Outra
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl h-12 gap-2"
                                        onClick={() => setIsSelectingRegion(true)}
                                        disabled={isRefining || isAnnotating || isSelectingRegion}
                                    >
                                        <Microscope className="w-4 h-4" /> Refinar Região
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl h-12 gap-2"
                                        onClick={async () => {
                                            setIsComparing(true)
                                            try {
                                                const res = await fetch('/api/artifacts?type=vision&limit=20')
                                                const data = await res.json()
                                                if (data.items) {
                                                    setPreviousAnalyses(data.items.map((item: any) => ({
                                                        id: item.id,
                                                        title: item.title,
                                                        date: new Date(item.createdAt).toLocaleDateString('pt-BR'),
                                                        content: item.content
                                                    })))
                                                }
                                            } catch (e) {
                                                console.error('Error loading previous analyses:', e)
                                            }
                                        }}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                        </svg> Comparar
                                    </Button>
                                    <Button
                                        className="w-full rounded-xl h-12 gap-2 bg-primary hover:bg-primary/90"
                                        onClick={() => {
                                            if (analysisResult && image) {
                                                toast.promise(
                                                    generateVisionPDF({ analysisResult, imageBase64: image, refinements }),
                                                    { loading: 'Gerando PDF...', success: 'PDF gerado!', error: 'Erro ao gerar PDF' }
                                                )
                                            }
                                        }}
                                    >
                                        <Download className="w-4 h-4" /> Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            {/* ─── LAUDO ─── */}
                            <div className="space-y-6">
                                <GlassCard className="p-6 flex flex-col">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
                                        <div>
                                            <h2 className="text-xl font-heading font-bold">Laudo AI</h2>
                                            <p className="text-xs text-muted-foreground">MedVision AI Engine v4.2</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {analysisResult.meta && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {analysisResult.meta.imageType}
                                                </Badge>
                                            )}
                                            {analysisPrecision !== null && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn('text-[10px] h-5 px-1.5 font-bold',
                                                        analysisPrecision >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                            : analysisPrecision >= 60 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                                : 'bg-red-500/10 text-red-400 border-red-400/30'
                                                    )}
                                                >
                                                    Precisão {analysisPrecision}%
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Concluído</Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        {/* Principais Achados */}
                                        <section className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Principais Achados
                                            </h4>
                                            <div className="space-y-2">
                                                {analysisResult.findings.map((finding, i) => {
                                                    const matchedDet = analysisResult.detections[i]
                                                    return (
                                                        <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                            <div className="space-y-0.5 min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className="text-sm font-medium">{finding.type}</p>
                                                                    {matchedDet?.toothNumber && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal">
                                                                            Dente {matchedDet.toothNumber}
                                                                        </Badge>
                                                                    )}
                                                                    {matchedDet?.cidCode && (
                                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono font-normal">
                                                                            {matchedDet.cidCode}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground truncate">{finding.zone}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                {finding.confidence !== undefined && (
                                                                    <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full border',
                                                                        finding.confidence >= 0.8 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                            : finding.confidence >= 0.6 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                                : 'bg-red-400/10 text-red-400 border-red-400/20'
                                                                    )}>
                                                                        {Math.round((finding.confidence as number) * 100)}% conf.
                                                                    </span>
                                                                )}
                                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/50 border border-border/50", finding.color)}>
                                                                    {finding.level}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {analysisResult.findings.length === 0 && (
                                                    <p className="text-sm text-muted-foreground italic pl-2">Nenhum achado crítico detectado.</p>
                                                )}
                                            </div>
                                        </section>

                                        {/* Per-Tooth Breakdown */}
                                        {analysisResult.report?.perToothBreakdown && analysisResult.report.perToothBreakdown.length > 0 && (
                                            <section className="space-y-3">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <Tag className="w-3 h-3" /> Achados por Dente (Notação FDI)
                                                </h4>
                                                <div className="overflow-x-auto rounded-lg border border-border/30">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-muted/30 border-b border-border/30">
                                                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Dente</th>
                                                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Achado</th>
                                                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">CID-10</th>
                                                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Severidade</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {analysisResult.report.perToothBreakdown.map((item, i) => (
                                                                <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                                                    <td className="px-3 py-2 font-bold text-primary">{item.tooth}</td>
                                                                    <td className="px-3 py-2 text-foreground/80">{item.findings}</td>
                                                                    <td className="px-3 py-2 font-mono text-muted-foreground">{item.cidCode || '—'}</td>
                                                                    <td className="px-3 py-2">
                                                                        {item.severity && (
                                                                            <Badge variant="outline" className={cn('text-[9px] h-4 px-1', getSeverityStyle(item.severity).badge)}>
                                                                                {getSeverityStyle(item.severity).ptLabel}
                                                                            </Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </section>
                                        )}

                                        {/* Report Sections */}
                                        {analysisResult.report && (
                                            <>
                                                <section className="space-y-2">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <Scan className="w-3 h-3" /> Análise Técnica
                                                    </h4>
                                                    <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10">
                                                        {analysisResult.report.technicalAnalysis}
                                                    </div>
                                                </section>

                                                <section className="space-y-2">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <Search className="w-3 h-3" /> Achados Detalhados
                                                    </h4>
                                                    <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10 whitespace-pre-line">
                                                        {analysisResult.report.detailedFindings}
                                                    </div>
                                                </section>

                                                <section className="space-y-2">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <FileText className="w-3 h-3" /> Hipótese Diagnóstica
                                                    </h4>
                                                    <div className="text-sm font-medium text-primary/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                                                        {analysisResult.report.diagnosticHypothesis}
                                                    </div>
                                                </section>

                                                {/* Differential Diagnosis */}
                                                {analysisResult.report.differentialDiagnosis && (
                                                    <section className="space-y-2">
                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                            <GitBranch className="w-3 h-3" /> Diagnóstico Diferencial
                                                        </h4>
                                                        <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10 whitespace-pre-line">
                                                            {analysisResult.report.differentialDiagnosis}
                                                        </div>
                                                    </section>
                                                )}

                                                <section className="space-y-3">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <CheckCircle2 className="w-3 h-3" /> Conduta Recomendada
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisResult.report.recommendations.map((rec, i) => (
                                                            <li key={i} className="flex gap-2 text-sm items-start">
                                                                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                                <span className="text-foreground">{rec}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            </>
                                        )}

                                        {/* Legacy fallback */}
                                        {!analysisResult.report && analysisResult.clinicalAssessment && (
                                            <section className="space-y-3">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <FileText className="w-3 h-3" /> Avaliação Clínica
                                                </h4>
                                                <div className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/20">
                                                    {analysisResult.clinicalAssessment}
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <img src="https://ui-avatars.com/api/?name=IA&background=0284c7&color=fff" className="w-10 h-10 rounded-full border border-primary/20" alt="IA" />
                                            <div>
                                                <p className="text-sm font-bold">MedVision AI</p>
                                                <p className="text-[10px] text-muted-foreground">CRM Virtual: 0001-AI</p>
                                            </div>
                                        </div>
                                        {isSaved ? (
                                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-500/10" onClick={() => router.push('/dashboard/biblioteca')}>
                                                <ExternalLink className="w-3 h-3" /> Ver na Biblioteca
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={saveToLibrary} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                {isSaving ? 'Salvando...' : 'Salvar na Biblioteca'}
                                            </Button>
                                        )}
                                    </div>
                                </GlassCard>

                                {/* ─── REFINAMENTOS ─── */}
                                {refinements.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-5 rounded-full bg-primary" />
                                            <h3 className="text-sm font-bold uppercase tracking-wide">
                                                Refinamentos de Região ({refinements.length})
                                            </h3>
                                        </div>

                                        {refinements.map((ref, idx) => (
                                            <GlassCard key={idx} className="overflow-hidden">
                                                <button
                                                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors text-left"
                                                    onClick={() => setExpandedRefinement(prev => prev === idx ? null : idx)}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-black/5 shrink-0">
                                                        <img
                                                            src={ref.regionImageBase64}
                                                            alt="Região refinada"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold">Refinamento #{idx + 1}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {ref.analysis.detections.length} achados • {new Date(ref.analyzedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {ref.analysis.detections.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {ref.analysis.detections.slice(0, 3).map((d, i) => (
                                                                    <Badge key={i} variant="outline" className={cn('text-[9px] h-4 px-1', getSeverityStyle(d.severity).badge)}>
                                                                        {d.label}
                                                                    </Badge>
                                                                ))}
                                                                {ref.analysis.detections.length > 3 && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                                        +{ref.analysis.detections.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={(e) => { e.stopPropagation(); removeRefinement(idx) }}
                                                            title="Remover refinamento"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                        {expandedRefinement === idx
                                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        }
                                                    </div>
                                                </button>

                                                {/* Expanded content */}
                                                <AnimatePresence>
                                                    {expandedRefinement === idx && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 pt-2 border-t border-border/30 space-y-4">
                                                                {/* Region image with detections */}
                                                                <div className="rounded-lg overflow-hidden border border-border/50 bg-black/5 max-h-48 flex items-center justify-center">
                                                                    <ImageOverlay
                                                                        src={ref.regionImageBase64}
                                                                        detections={ref.analysis.detections}
                                                                        className="max-h-48"
                                                                    />
                                                                </div>

                                                                {/* Refined findings */}
                                                                {ref.analysis.findings.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Achados Refinados</p>
                                                                        {ref.analysis.findings.map((f, i) => {
                                                                            const det = ref.analysis.detections[i]
                                                                            return (
                                                                                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border/20 flex items-center justify-between">
                                                                                    <div>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <p className="text-xs font-medium">{f.type}</p>
                                                                                            {det?.toothNumber && (
                                                                                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                                                                    {det.toothNumber}
                                                                                                </Badge>
                                                                                            )}
                                                                                            {det?.cidCode && (
                                                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
                                                                                                    {det.cidCode}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.zone}</p>
                                                                                    </div>
                                                                                    <Badge variant="outline" className={cn('text-[9px] h-4 px-1', f.color.replace('text-', 'text-').replace('-500', '-500'))}>
                                                                                        {f.level}
                                                                                    </Badge>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Refined report */}
                                                                {ref.analysis.report?.detailedFindings && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Análise Detalhada da Região</p>
                                                                        <p className="text-xs text-foreground/80 leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/10 whitespace-pre-line">
                                                                            {ref.analysis.report.detailedFindings}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {ref.analysis.report?.diagnosticHypothesis && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hipótese Diagnóstica</p>
                                                                        <p className="text-xs font-medium text-primary/80 leading-relaxed bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                                                                            {ref.analysis.report.diagnosticHypothesis}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </GlassCard>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fullscreen Modal */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent
                    className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-white/10 overflow-hidden [&>button]:text-white [&>button]:hover:bg-white/20"
                    showCloseButton={true}
                >
                    <VisuallyHidden>
                        <DialogTitle>Imagem em tela cheia</DialogTitle>
                    </VisuallyHidden>
                    <div className="relative w-full h-full flex items-center justify-center p-6 pt-12">
                        {image && analysisResult && (
                            <ImageOverlay
                                src={image}
                                detections={analysisResult.detections}
                                className="max-w-full max-h-[85vh]"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Comparison Modal */}
            <Dialog open={isComparing} onOpenChange={setIsComparing}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Comparar Análises
                    </DialogTitle>
                    <div className="space-y-4 mt-4">
                        {previousAnalyses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Nenhuma análise anterior encontrada na biblioteca.
                            </p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Análise Atual</h4>
                                        <div className="p-3 rounded-lg border bg-muted/30">
                                            <p className="text-sm font-medium">{analysisResult?.report?.diagnosticHypothesis?.slice(0, 100) || 'Sem hipótese'}...</p>
                                            <p className="text-xs text-muted-foreground mt-1">{analysisResult?.detections?.length || 0} detecções</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Selecione uma análise anterior:</h4>
                                        <div className="max-h-60 overflow-auto space-y-2">
                                            {previousAnalyses.map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="w-full p-3 rounded-lg border text-left hover:bg-muted/30 transition-colors"
                                                    onClick={() => {
                                                        setComparisonItems([item.content.analysis, analysisResult as any])
                                                        setIsComparing(false)
                                                    }}
                                                >
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {comparisonItems.length > 0 && (
                                    <div className="mt-6 p-4 rounded-lg border">
                                        <h4 className="font-medium mb-3">Comparação Estrutural</h4>
                                        {(() => {
                                            const current = comparisonItems[1]?.detections || []
                                            const previous = comparisonItems[0]?.detections || []
                                            
                                            const currentTeeth = new Set(current.map((d: any) => d.toothNumber).filter(Boolean))
                                            const previousTeeth = new Set(previous.map((d: any) => d.toothNumber).filter(Boolean))
                                            
                                            const newTeeth = [...currentTeeth].filter(t => !previousTeeth.has(t))
                                            const resolvedTeeth = [...previousTeeth].filter(t => !currentTeeth.has(t))
                                            const stableTeeth = [...currentTeeth].filter(t => previousTeeth.has(t))
                                            
                                            return (
                                                <div className="space-y-3 text-sm">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                                                            <p className="font-medium text-green-600">{newTeeth.length}</p>
                                                            <p className="text-xs text-muted-foreground">Novos achados</p>
                                                        </div>
                                                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                                            <p className="font-medium text-amber-600">{stableTeeth.length}</p>
                                                            <p className="text-xs text-muted-foreground">Estáveis</p>
                                                        </div>
                                                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                                                            <p className="font-medium text-blue-600">{resolvedTeeth.length}</p>
                                                            <p className="text-xs text-muted-foreground">Resolvidos</p>
                                                        </div>
                                                    </div>
                                                    {newTeeth.length > 0 && (
                                                        <p className="text-xs"><span className="font-medium text-green-600">Novos:</span> Dentes {newTeeth.join(', ')}</p>
                                                    )}
                                                    {resolvedTeeth.length > 0 && (
                                                        <p className="text-xs"><span className="font-medium text-blue-600">Resolvidos:</span> Dentes {resolvedTeeth.join(', ')}</p>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Scroll moderno: usar classes CSS de app/globals.css */}
        </div>
    )
}
