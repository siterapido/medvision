'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
    Search,
    Scan,
    AlertCircle,
    CheckCircle2,
    Download,
    RefreshCcw,
    Maximize2,
    Loader2,
    ChevronRight,
    Sparkles,
    AlertTriangle,
    Save,
    ExternalLink,
    Pencil,
    Tag,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Image as ImageIcon,
    FileText,
    Microscope,
    Info,
    GitBranch,
    X,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GlassCard } from '@/components/ui/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getSeverityStyle } from '@/lib/constants/vision'
import { VisionAnalysisResult, VisionArtifactContent, VisionRefinement, BoundingBox } from '@/lib/types/vision'
import { DEFAULT_REPORT_SECTIONS } from '@/lib/constants/vision-analysis-options'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import { ImageOverlay } from '@/components/vision/image-overlay'
import { InadequateImageError } from '@/components/vision/inadequate-image-error'
import { AnnotationToolbar } from '@/components/vision/annotation-toolbar'
import { AnnotationCanvas } from '@/components/vision/annotation-canvas'
import { RegionSelector } from '@/components/vision/region-selector'
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
    MedVisionConfigureStep,
    MedVisionReviewStep,
    MedVisionStepIndicator,
    VisionClinicalDisclaimer,
    VisionErrorBanner,
    VisionErrorRecovery,
    type VisionState,
} from '@/components/vision/med-vision'

const DEFAULT_ANALYSIS_CONFIG: MedVisionAnalysisConfig = {
    specialty: 'geral',
    clinicalContext: '',
    modality: 'rx',
    reportDepth: 'completo',
    focusTags: [],
    reportSections: { ...DEFAULT_REPORT_SECTIONS },
}

export default function MedVisionPage() {
    const router = useRouter()
    const { playSuccess } = useSoundNotification()
    const [state, setState] = useState<VisionState>('CONFIGURE')
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
    const [config, setConfig] = useState<MedVisionAnalysisConfig>(DEFAULT_ANALYSIS_CONFIG)

    // Quality validation state
    const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null)

    // Inadequate image error state
    const [inadequateImageError, setInadequateImageError] = useState<{ reason: string; details?: string } | null>(null)

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
    /** Após análise: radiografia, laudo ou conduta recomendada. */
    const [resultMainTab, setResultMainTab] = useState<'image' | 'laudo' | 'conduta'>('image')

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

    // Recorte de região para refinamento (resultado)
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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            try {
                const imageBase64 = await readImageAsBase64(file)
                const compressed = await compressImageForAnalysis(imageBase64, 1024, 0.85)
                setOriginalImage(compressed)
                setImage(compressed)
                const result = await validateImageQuality(compressed)
                setQualityResult(result)
                setState('CONFIGURE')
            } catch (error) {
                console.error("Error processing image:", error)
                toast.error("Erro ao processar imagem. Tente outro arquivo.")
                setState('CONFIGURE')
            }
        }
    }, [])

    const patchConfig = useCallback((patch: Partial<MedVisionAnalysisConfig>) => {
        setConfig((prev) => ({ ...prev, ...patch }))
    }, [])

    const buildAnalysisBody = useCallback(
        (imageData: string, extra?: Record<string, unknown>) => ({
            image: imageData,
            specialty: config.specialty,
            clinicalContext: config.clinicalContext.trim() || undefined,
            modality: config.modality,
            reportDepth: config.reportDepth,
            focusTags: config.focusTags.length ? config.focusTags : undefined,
            patientAge: config.patientAge,
            patientSex: config.patientSex,
            reportSections: config.reportSections,
            ...extra,
        }),
        [config],
    )

    const startSingleAnalysis = async (imageData: string) => {
        setState('ANALYZING')
        setProgress(0)
        setAnalysisResult(null)
        setAnalysisPrecision(null)
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
                body: JSON.stringify(buildAnalysisBody(imageData))
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
                    'INADEQUATE_IMAGE': 'Esta imagem não é adequada para análise.',
                }

                const friendlyMsg = errorCode ? errorMessages[errorCode] : null
                const errorMsg = friendlyMsg || errorMessage || errorDetail || errData?.error || `Falha na análise (${response.status})`

                if (errorCode === 'INADEQUATE_IMAGE') {
                    setInadequateImageError({
                        reason: typeof errorMsg === 'string' ? errorMsg : errorMessages['INADEQUATE_IMAGE'],
                        details: errData?.error?.details,
                    })
                }

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
        maxRetries = 2
    ): Promise<VisionAnalysisResult | null> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch('/api/vision/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAnalysisBody(imageData))
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

    const startAnalysis = (imageData: string) => {
        startSingleAnalysis(imageData)
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
                body: JSON.stringify(
                    buildAnalysisBody(regionImage, {
                        mode: 'refine',
                        originalAnalysisSummary,
                    }),
                )
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
    }, [image, analysisResult, buildAnalysisBody, cropRegionFromImage])

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
        setState('CONFIGURE')
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
        setConfig(DEFAULT_ANALYSIS_CONFIG)
        setImageToolsExpanded(false)
        setInadequateImageError(null)
        clearAnnotations()
        setResultMainTab('image')
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
                    {state === 'ERROR' && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
                            <MedVisionStepIndicator state={state} />
                            <VisionErrorBanner />
                            {inadequateImageError ? (
                                <InadequateImageError
                                    reason={inadequateImageError.reason}
                                    details={inadequateImageError.details}
                                    hasImage={Boolean(image)}
                                    onTryAgain={() => {
                                        setInadequateImageError(null)
                                        if (image) setState('REVIEW')
                                    }}
                                    onNewUpload={() => {
                                        setInadequateImageError(null)
                                        reset()
                                    }}
                                />
                            ) : (
                                <VisionErrorRecovery
                                    hasImage={Boolean(image)}
                                    onRetry={() => image && startAnalysis(image)}
                                    onBackToReview={() => setState('REVIEW')}
                                    onNewUpload={reset}
                                />
                            )}
                        </motion.div>
                    )}

                    {state === 'CONFIGURE' && (
                        <MedVisionConfigureStep
                            state={state}
                            originalImage={originalImage}
                            config={config}
                            onConfigChange={patchConfig}
                            qualityResult={qualityResult}
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            isDragActive={isDragActive}
                            onBack={() => {
                                setOriginalImage(null)
                                setImage(null)
                                setQualityResult(null)
                            }}
                            onContinue={() => {
                                if (originalImage) {
                                    setImage(originalImage)
                                    setState('REVIEW')
                                }
                            }}
                        />
                    )}

                    {state === 'REVIEW' && originalImage && image && (
                        <MedVisionReviewStep
                            state={state}
                            originalImage={originalImage}
                            image={image}
                            config={config}
                            onBack={() => setState('CONFIGURE')}
                            onAnalyze={startAnalysis}
                            onImageReady={setImage}
                        />
                    )}

                    {state === 'ANALYZING' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="w-full"
                        >
                            <AnalyzingStage state={state} image={image} progress={progress} />
                        </motion.div>
                    )}

                    {/* ─── RESULT ─── */}
                    {state === 'RESULT' && analysisResult && (
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

                            <Tabs
                                value={resultMainTab}
                                onValueChange={(v) => setResultMainTab(v as 'image' | 'laudo' | 'conduta')}
                                className="w-full flex flex-col gap-4"
                            >
                                <TabsList
                                    className="grid h-12 w-full max-w-2xl grid-cols-3 gap-0 rounded-2xl border border-border/50 bg-muted/30 p-1.5"
                                >
                                    <TabsTrigger
                                        value="image"
                                        className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                    >
                                        <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                                        Radiografia
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="laudo"
                                        className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                    >
                                        <FileText className="h-4 w-4 shrink-0" aria-hidden />
                                        <span>Laudo</span>
                                        {analysisResult.findings.length > 0 && (
                                            <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                                                {analysisResult.findings.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="conduta"
                                        className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                    >
                                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                                        Conduta
                                        {analysisResult.report?.recommendations && analysisResult.report.recommendations.length > 0 && (
                                            <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                                                {analysisResult.report.recommendations.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="image" className="mt-0 space-y-4 outline-none">
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
                                </div>
                                </TabsContent>

                            {/* Laudo: texto e refinamentos (aba) */}
                                <TabsContent value="laudo" className="mt-0 max-w-3xl w-full self-center space-y-6 outline-none">
                            <div className="space-y-6 w-full">
                                <GlassCard className="p-6 flex flex-col">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
                                        <div>
                                            <h2 className="text-xl font-heading font-bold">Laudo clínico</h2>
                                            <p className="text-xs text-muted-foreground">Texto completo e achados alinhados à radiografia</p>
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

                                    <div className="mt-6 pt-4 border-t border-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <img src="https://ui-avatars.com/api/?name=IA&background=0284c7&color=fff" className="w-10 h-10 rounded-full border border-primary/20" alt="IA" />
                                            <div>
                                                <p className="text-sm font-bold">MedVision AI</p>
                                                <p className="text-[10px] text-muted-foreground">CRM Virtual: 0001-AI</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => {
                                                    if (analysisResult && image) {
                                                        toast.promise(
                                                            generateVisionPDF({ analysisResult, imageBase64: image, refinements, variant: 'laudo' }),
                                                            { loading: 'Gerando PDF do laudo...', success: 'PDF do laudo gerado!', error: 'Erro ao gerar PDF' }
                                                        )
                                                    }
                                                }}
                                            >
                                                <Download className="w-3 h-3" /> PDF do Laudo
                                            </Button>
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
                                </TabsContent>

                                <TabsContent value="conduta" className="mt-0 max-w-3xl w-full self-center space-y-6 outline-none">
                                    <GlassCard className="p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
                                            <div>
                                                <h2 className="text-xl font-heading font-bold">Conduta recomendada</h2>
                                                <p className="text-xs text-muted-foreground">Orientações clínicas derivadas da análise</p>
                                            </div>
                                            {analysisResult.meta && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {analysisResult.meta.imageType}
                                                </Badge>
                                            )}
                                        </div>

                                        {analysisResult.report?.diagnosticHypothesis && (
                                            <section className="space-y-2 mb-6">
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <FileText className="w-3 h-3" /> Hipótese Diagnóstica
                                                </h4>
                                                <div className="text-sm font-medium text-primary/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                                                    {analysisResult.report.diagnosticHypothesis}
                                                </div>
                                            </section>
                                        )}

                                        {analysisResult.report?.recommendations && analysisResult.report.recommendations.length > 0 ? (
                                            <ul className="space-y-3">
                                                {analysisResult.report.recommendations.map((rec, i) => (
                                                    <li key={i} className="flex gap-3 text-sm items-start p-3 rounded-lg bg-muted/30 border border-border/30">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-foreground leading-relaxed pt-0.5">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Nenhuma conduta recomendada foi gerada para esta análise.</p>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <img src="https://ui-avatars.com/api/?name=IA&background=0284c7&color=fff" className="w-10 h-10 rounded-full border border-primary/20" alt="IA" />
                                                <div>
                                                    <p className="text-sm font-bold">MedVision AI</p>
                                                    <p className="text-[10px] text-muted-foreground">CRM Virtual: 0001-AI</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1"
                                                disabled={!analysisResult.report?.recommendations?.length}
                                                onClick={() => {
                                                    if (analysisResult && image) {
                                                        toast.promise(
                                                            generateVisionPDF({ analysisResult, imageBase64: image, refinements, variant: 'conduta' }),
                                                            { loading: 'Gerando PDF da conduta...', success: 'PDF da conduta gerado!', error: 'Erro ao gerar PDF' }
                                                        )
                                                    }
                                                }}
                                            >
                                                <Download className="w-3 h-3" /> PDF da Conduta
                                            </Button>
                                        </div>
                                    </GlassCard>
                                </TabsContent>
                            </Tabs>
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
