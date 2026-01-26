'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
    AlertTriangle
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { VisionAnalysisResult } from '@/lib/types/vision'
import { ImageOverlay } from '@/components/vision/image-overlay'
import { toast } from 'sonner'
import { generateVisionPDF } from '@/lib/utils/generate-vision-pdf'

type VisionState = 'UPLOAD' | 'ANALYZING' | 'RESULT' | 'ERROR'

export default function OdontoVisionPage() {
    const [state, setState] = useState<VisionState>('UPLOAD')
    const [image, setImage] = useState<string | null>(null) // Base64
    const [progress, setProgress] = useState(0)
    const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null)


    // Read image file as base64 without compression
    const readImageAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (err) => reject(err)
        })
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            try {
                // Read image without compression for maximum quality
                const imageBase64 = await readImageAsBase64(file)
                setImage(imageBase64)
                startAnalysis(imageBase64)
            } catch (error) {
                console.error("Error processing image:", error)
                toast.error("Erro ao processar imagem. Tente outro arquivo.")
            }
        }
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
        setProgress(0)
        setAnalysisResult(null)
    }

    return (
        <div className="min-h-screen pb-20 pt-6 px-4 md:px-8 max-w-6xl mx-auto">
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
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left Column - Image with Detections */}
                            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                                <GlassCard className="p-1 overflow-hidden group">
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black/5">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Implementação do Overlay Real */}
                                            {image && (
                                                <ImageOverlay
                                                    src={image}
                                                    detections={analysisResult.detections}
                                                />
                                            )}
                                        </div>

                                        <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none">
                                            <Button size="icon" variant="secondary" className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full pointer-events-auto">
                                                <Maximize2 className="w-4 h-4" />
                                            </Button>
                                        </div>
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

                            {/* Right Column - Laudo / Findings */}
                            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                                <GlassCard className="p-6 h-full flex flex-col">
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

                                    <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
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
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs gap-1"
                                            onClick={() => {
                                                if (!analysisResult) return;
                                                const promise = fetch('/api/artifacts', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        title: `Laudo Vision: ${analysisResult.meta?.imageType || 'Imagem'}`,
                                                        description: analysisResult.report?.diagnosticHypothesis || 'Análise automática de imagem.',
                                                        type: 'image', // Mapping to artifact type
                                                        content: {
                                                            imageUrl: image, // Careful with size here, might need URL if uploaded
                                                            analysis: JSON.stringify(analysisResult.report),
                                                            findings: analysisResult.findings.map(f => f.type),
                                                            recommendations: analysisResult.report?.recommendations || []
                                                        }
                                                    })
                                                });
                                                toast.promise(promise, {
                                                    loading: 'Salvando na biblioteca...',
                                                    success: 'Salvo com sucesso!',
                                                    error: 'Erro ao salvar.'
                                                })
                                            }}
                                        >
                                            <FileText className="w-3 h-3" /> Salvar Laudo
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    )
}
