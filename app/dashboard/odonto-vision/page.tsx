'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import Cropper, { Area } from 'react-easy-crop'
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
    Pencil
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { VisionAnalysisResult, VisionArtifactContent } from '@/lib/types/vision'
import { ImageOverlay } from '@/components/vision/image-overlay'
import { QualityFeedback } from '@/components/vision/quality-feedback'
import { AnnotationToolbar } from '@/components/vision/annotation-toolbar'
import { AnnotationCanvas } from '@/components/vision/annotation-canvas'
import { validateImageQuality, ImageQualityResult } from '@/lib/utils/image-quality-validator'
import { useAnnotations } from '@/lib/hooks/use-annotations'
import { toast } from 'sonner'
import { generateVisionPDF } from '@/lib/utils/generate-vision-pdf'

type VisionState = 'UPLOAD' | 'VALIDATING' | 'CROP' | 'ANALYZING' | 'RESULT' | 'ERROR'

export default function OdontoVisionPage() {
    const router = useRouter()
    const [state, setState] = useState<VisionState>('UPLOAD')
    const [image, setImage] = useState<string | null>(null) // Base64
    const [originalImage, setOriginalImage] = useState<string | null>(null) // Original before crop
    const [progress, setProgress] = useState(0)
    const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Crop states
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

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
        setAnnotations
    } = useAnnotations()

    // Generate thumbnail from image
    const generateThumbnail = useCallback(async (imageSrc: string, size: number = 200): Promise<string> => {
        const img = new Image()
        img.src = imageSrc
        await new Promise((resolve) => { img.onload = resolve })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        // Calculate aspect ratio
        const aspectRatio = img.width / img.height
        let width = size
        let height = size

        if (aspectRatio > 1) {
            height = size / aspectRatio
        } else {
            width = size * aspectRatio
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        return canvas.toDataURL('image/jpeg', 0.7)
    }, [])

    // Save analysis to biblioteca
    const saveToLibrary = useCallback(async () => {
        if (!analysisResult || !image || isSaving) return

        setIsSaving(true)
        try {
            const thumbnail = await generateThumbnail(image)
            const imageType = analysisResult.meta?.imageType || 'Imagem'
            const date = new Date().toLocaleDateString('pt-BR')

            const content: VisionArtifactContent = {
                thumbnailBase64: thumbnail,
                imageBase64: image,
                analysis: analysisResult,
                annotations: annotations,
                analyzedAt: new Date().toISOString()
            }

            const response = await fetch('/api/artifacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Laudo Vision: ${imageType} - ${date}`,
                    description: analysisResult.report?.diagnosticHypothesis?.slice(0, 200) || 'Análise de imagem odontológica',
                    type: 'vision',
                    content
                })
            })

            if (!response.ok) throw new Error('Falha ao salvar')

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
    }, [analysisResult, image, isSaving, generateThumbnail, router])


    // Read image file as base64 without compression
    const readImageAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (err) => reject(err)
        })
    }

    // Crop callback
    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    // Create cropped image from canvas
    const createCroppedImage = useCallback(async (imageSrc: string, pixelCrop: Area): Promise<string> => {
        const image = new Image()
        image.src = imageSrc

        await new Promise((resolve) => {
            image.onload = resolve
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            throw new Error('Could not get canvas context')
        }

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return canvas.toDataURL('image/jpeg', 0.95)
    }, [])

    // Handle crop confirmation
    const handleCropConfirm = useCallback(async () => {
        if (!originalImage || !croppedAreaPixels) return

        try {
            const croppedImage = await createCroppedImage(originalImage, croppedAreaPixels)
            setImage(croppedImage)
            startAnalysis(croppedImage)
        } catch (error) {
            console.error('Error cropping image:', error)
            toast.error('Erro ao recortar imagem')
        }
    }, [originalImage, croppedAreaPixels, createCroppedImage])

    // Skip crop and use original
    const handleSkipCrop = useCallback(() => {
        if (!originalImage) return
        setImage(originalImage)
        startAnalysis(originalImage)
    }, [originalImage])

    // Reset crop controls
    const resetCrop = useCallback(() => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }, [])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            try {
                // Read image without compression for maximum quality
                const imageBase64 = await readImageAsBase64(file)
                setOriginalImage(imageBase64)
                setImage(imageBase64)

                // Validate image quality
                setState('VALIDATING')
                const result = await validateImageQuality(imageBase64)
                setQualityResult(result)

                // If perfect quality, skip validation screen
                if (result.isValid) {
                    setState('CROP')
                    resetCrop()
                }
            } catch (error) {
                console.error("Error processing image:", error)
                toast.error("Erro ao processar imagem. Tente outro arquivo.")
                setState('UPLOAD')
            }
        }
    }, [resetCrop])

    // Handle proceeding after validation
    const handleValidationProceed = useCallback(() => {
        setState('CROP')
        resetCrop()
    }, [resetCrop])

    // Handle canceling validation (go back to upload)
    const handleValidationCancel = useCallback(() => {
        setOriginalImage(null)
        setImage(null)
        setQualityResult(null)
        setState('UPLOAD')
    }, [])

    const startAnalysis = async (imageData: string) => {
        setState('ANALYZING')
        setProgress(0)
        setAnalysisResult(null)

        // Simula progresso visual enquanto processa
        const interval = setInterval(() => {
            setProgress((prev) => (prev < 90 ? prev + 5 : prev))
        }, 300)

        try {
            const response = await fetch('/api/vision/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            })

            if (!response.ok) throw new Error('Falha na análise')

            const data = await response.json() as VisionAnalysisResult

            clearInterval(interval)
            setProgress(100)
            setAnalysisResult(data)

            // Pequeno delay para mostrar 100%
            setTimeout(() => setState('RESULT'), 500)

        } catch (error) {
            clearInterval(interval)
            console.error(error)
            toast.error("Erro ao analisar imagem. Tente novamente.")
            setState('ERROR')
        }
    }

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
        setIsSaved(false)
        setIsSaving(false)
        setQualityResult(null)
        setIsAnnotating(false)
        clearAnnotations()
        resetCrop()
    }

    return (
        <div className="min-h-screen pb-20 pt-6 px-4 md:px-8 max-w-6xl mx-auto custom-scrollbar overflow-y-auto">
            {/* Header */}
            <header className="mb-10 space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Scan className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
                        Odonto Vision
                    </h1>
                </div>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                    Envie radiografias ou fotos intraorais para uma análise profunda assistida por inteligência artificial.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                <AnimatePresence mode="wait">
                    {(state === 'UPLOAD' || state === 'ERROR') && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            {state === 'ERROR' && (
                                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                                    <AlertTriangle className="w-5 h-5" />
                                    <p className="text-sm font-medium">Ocorreu um erro ao processar a imagem. Por favor, tente uma imagem mais nítida ou menor.</p>
                                </div>
                            )}

                            <GlassCard className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 transition-all duration-500 min-h-[400px]"
                                {...getRootProps()}
                            >
                                <input {...getInputProps()} />
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 group-hover:scale-110 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-500">
                                        <FileUp className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                                    {isDragActive ? 'Solte a imagem agora' : 'Arraste e solte sua imagem'}
                                </h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                                    Suporta radiografias periapicais, panorâmicas e fotos clínicas (PNG, JPG).
                                </p>

                                <Button variant="outline" className="rounded-full px-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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

                    {state === 'VALIDATING' && originalImage && qualityResult && (
                        <QualityFeedback
                            result={qualityResult}
                            imagePreview={originalImage}
                            onProceed={handleValidationProceed}
                            onCancel={handleValidationCancel}
                        />
                    )}

                    {state === 'CROP' && originalImage && (
                        <motion.div
                            key="crop"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="w-full space-y-6"
                        >
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

                                {/* Crop Area */}
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/90 border border-border/50">
                                    <Cropper
                                        image={originalImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={undefined}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        showGrid={true}
                                        style={{
                                            containerStyle: {
                                                backgroundColor: 'rgb(0 0 0 / 0.9)'
                                            }
                                        }}
                                    />
                                </div>

                                {/* Zoom Controls */}
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

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-6 pt-4 border-t border-border/30">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 rounded-xl gap-2"
                                        onClick={handleSkipCrop}
                                    >
                                        <X className="w-4 h-4" />
                                        Pular Recorte
                                    </Button>
                                    <Button
                                        className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90"
                                        onClick={handleCropConfirm}
                                    >
                                        <Check className="w-4 h-4" />
                                        Confirmar e Analisar
                                    </Button>
                                </div>
                            </GlassCard>

                            {/* Tips */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassCard className="p-4 flex gap-4 items-start bg-muted/20 border-border/30">
                                    <Crop className="w-5 h-5 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-semibold">Área de Interesse</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Recorte para focar em uma região específica da radiografia.</p>
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-4 flex gap-4 items-start bg-muted/20 border-border/30">
                                    <ZoomIn className="w-5 h-5 text-primary shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-semibold">Zoom Preciso</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Use o zoom para ampliar e selecionar áreas menores com precisão.</p>
                                    </div>
                                </GlassCard>
                            </div>
                        </motion.div>
                    )}

                    {state === 'ANALYZING' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex flex-col items-center justify-center min-h-[500px]"
                        >
                            <div className="relative w-full max-w-xl aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-black/40">
                                {image && <img src={image} className="w-full h-full object-cover opacity-60 grayscale" alt="Analyzing" />}

                                {/* Scanning Line Effect */}
                                <motion.div
                                    className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] z-10"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                />

                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                                    <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <div className="text-center">
                                            <h3 className="font-heading font-bold text-lg">Processando Imagem</h3>
                                            <p className="text-sm text-muted-foreground">Utilizando OdontoVision AI Engine v4.2</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-md mt-12 space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-primary flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Analisando estruturas...
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        </motion.div>
                    )}

                    {state === 'RESULT' && analysisResult && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-8 max-w-4xl mx-auto"
                        >
                            {/* Image with Detections - Full Width, Larger */}
                            <div className="space-y-4">
                                <GlassCard className="p-1 overflow-hidden group">
                                    <div
                                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-black/5"
                                        ref={(el) => {
                                            if (el && (el.offsetWidth !== imageSize.width || el.offsetHeight !== imageSize.height)) {
                                                setImageSize({ width: el.offsetWidth, height: el.offsetHeight })
                                            }
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Implementação do Overlay Real */}
                                            {image && (
                                                <ImageOverlay
                                                    src={image}
                                                    detections={analysisResult.detections}
                                                    annotations={annotations}
                                                />
                                            )}
                                        </div>

                                        {/* Annotation Canvas Overlay */}
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

                                        {/* Action buttons */}
                                        {!isAnnotating && (
                                            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full pointer-events-auto"
                                                    onClick={() => setIsAnnotating(true)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full pointer-events-auto"
                                                    onClick={() => setIsFullscreen(true)}
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                <div className="flex flex-wrap gap-4">
                                    <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2" onClick={reset}>
                                        <RefreshCcw className="w-4 h-4" /> Analisar Outra
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl h-12 gap-2 bg-primary hover:bg-primary/90"
                                        onClick={() => {
                                            if (analysisResult && image) {
                                                toast.promise(
                                                    generateVisionPDF({ analysisResult, imageBase64: image }),
                                                    {
                                                        loading: 'Gerando PDF...',
                                                        success: 'PDF gerado com sucesso!',
                                                        error: 'Erro ao gerar PDF'
                                                    }
                                                )
                                            }
                                        }}
                                    >
                                        <Download className="w-4 h-4" /> Exportar Laudo (PDF)
                                    </Button>
                                </div>
                            </div>

                            {/* Laudo / Findings - Below Image */}
                            <div className="space-y-6">
                                <GlassCard className="p-6 flex flex-col">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
                                        <div>
                                            <h2 className="text-xl font-heading font-bold">Laudo AI</h2>
                                            <p className="text-xs text-muted-foreground">ID: #{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {analysisResult.meta && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {analysisResult.meta.imageType}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                Concluído
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        {/* Findings List - Quick View */}
                                        <section className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Principais Achados
                                            </h4>
                                            <div className="space-y-2">
                                                {analysisResult.findings.map((finding, i) => (
                                                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-medium">{finding.type}</p>
                                                            <p className="text-[10px] text-muted-foreground">{finding.zone}</p>
                                                        </div>
                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/50 border border-border/50", finding.color)}>
                                                            {finding.level}
                                                        </span>
                                                    </div>
                                                ))}
                                                {analysisResult.findings.length === 0 && (
                                                    <p className="text-sm text-muted-foreground italic pl-2">Nenhum achado crítico detectado.</p>
                                                )}
                                            </div>
                                        </section>

                                        {/* Detailed Report Sections */}
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

                                        {/* Legacy/Fallback Display if Report is missing */}
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
                                            <img src="https://ui-avatars.com/api/?name=IA&background=0284c7&color=fff" className="w-10 h-10 rounded-full border border-primary/20" alt="IA signature" />
                                            <div>
                                                <p className="text-sm font-bold">OdontoVision AI</p>
                                                <p className="text-[10px] text-muted-foreground">CRM Virtual: 0001-AI</p>
                                            </div>
                                        </div>
                                        {isSaved ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-500/10"
                                                onClick={() => router.push('/dashboard/biblioteca')}
                                            >
                                                <ExternalLink className="w-3 h-3" /> Ver na Biblioteca
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-xs gap-1"
                                                onClick={saveToLibrary}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Save className="w-3 h-3" />
                                                )}
                                                {isSaving ? 'Salvando...' : 'Salvar na Biblioteca'}
                                            </Button>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fullscreen Image Modal */}
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

            <style jsx global>{`
        html {
          scroll-behavior: smooth;
          overflow: auto;
        }
        body {
          overflow: auto;
        }
        ::-webkit-scrollbar {
          width: 12px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(200, 200, 200, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.7);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          cursor: grab;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 1);
          background-clip: content-box;
          cursor: grabbing;
        }
        ::-webkit-scrollbar-thumb:active {
          background: rgba(29, 78, 216, 1);
          background-clip: content-box;
        }
      `}</style>
        </div>
    )
}
