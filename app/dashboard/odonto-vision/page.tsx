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
    Info
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type VisionState = 'UPLOAD' | 'ANALYZING' | 'RESULT'

export default function OdontoVisionPage() {
    const [state, setState] = useState<VisionState>('UPLOAD')
    const [image, setImage] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const startAnalysis = () => {
        setState('ANALYZING')
        setProgress(0)
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setImage(reader.result as string)
                startAnalysis()
            }
            reader.readAsDataURL(file)
        }
    }, [])

    useEffect(() => {
        if (state === 'ANALYZING') {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        setTimeout(() => setState('RESULT'), 500)
                        return 100
                    }
                    return prev + 2
                })
            }, 50)
            return () => clearInterval(interval)
        }
    }, [state])

    const reset = () => {
        setState('UPLOAD')
        setImage(null)
        setProgress(0)
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
                    {state === 'UPLOAD' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
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
                                        Detectando estruturas...
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-center text-muted-foreground italic">
                                    Isso pode levar alguns segundos dependendo da complexidade da imagem.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {state === 'RESULT' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left Column - Image with Detections */}
                            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                                <GlassCard className="p-1 overflow-hidden group">
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50">
                                        <img src={image || ''} className="w-full h-full object-cover" alt="Result" />

                                        {/* Mock Detections Overlays */}
                                        <div className="absolute top-[30%] left-[45%] w-12 h-12 border-2 border-red-500 rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.5)] bg-red-500/10 flex items-center justify-center animate-pulse">
                                            <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Cárie</div>
                                        </div>

                                        <div className="absolute top-[60%] left-[20%] w-16 h-10 border-2 border-amber-500 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.5)] bg-amber-500/10 flex items-center justify-center">
                                            <div className="absolute -top-6 left-0 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Perda Óssea</div>
                                        </div>

                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <Button size="icon" variant="secondary" className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 rounded-full">
                                                <Maximize2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>

                                <div className="flex flex-wrap gap-4">
                                    <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2" onClick={reset}>
                                        <RefreshCcw className="w-4 h-4" /> Analisar Outra
                                    </Button>
                                    <Button className="flex-1 rounded-xl h-12 gap-2 bg-primary hover:bg-primary/90">
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
                                            <p className="text-xs text-muted-foreground">ID: #VIS-99421-2026</p>
                                        </div>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                            Análise Concluída
                                        </Badge>
                                    </div>

                                    <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                        {/* Findings */}
                                        <section className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Principais Achados
                                            </h4>
                                            <div className="space-y-2">
                                                {[
                                                    { type: 'Cárie', zone: 'Região Interproximal (16-17)', level: 'Crítico', color: 'text-red-500' },
                                                    { type: 'Reabsorção', zone: 'Crista Óssea Alveolar', level: 'Moderado', color: 'text-amber-500' },
                                                    { type: 'Restauração', zone: 'Oclusal (46)', level: 'Normal', color: 'text-blue-400' },
                                                ].map((finding, i) => (
                                                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-medium">{finding.type}</p>
                                                            <p className="text-[10px] text-muted-foreground">{finding.zone}</p>
                                                        </div>
                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/50 border border-border/50", finding.color)}>
                                                            {finding.level}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* AI Assessment */}
                                        <section className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <FileText className="w-3 h-3" /> Avaliação Clínica
                                            </h4>
                                            <div className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/20">
                                                <p className="mb-3">
                                                    A análise automatizada detectou uma área radiolúcida sugestiva de lesão cariosa profunda na face distal do dente 16, com possível proximidade cameral.
                                                </p>
                                                <p>
                                                    Observa-se também evidência de perda óssea horizontal generalizada leve, com focos de perda vertical na região de molares inferiores. Recomenda-se correlação clínica e sondagem periodontal.
                                                </p>
                                            </div>
                                        </section>

                                        {/* Recommendations */}
                                        <section className="space-y-3">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3" /> Sugestão de Conduta
                                            </h4>
                                            <ul className="space-y-2">
                                                {[
                                                    'Remoção de cárie e restauração (16)',
                                                    'Acompanhamento radiográfico em 6 meses',
                                                    'Avaliação periodontal completa'
                                                ].map((rec, i) => (
                                                    <li key={i} className="flex gap-2 text-sm items-start">
                                                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border/30 flex items-center gap-3">
                                        <img src="https://ui-avatars.com/api/?name=IA&background=0284c7&color=fff" className="w-10 h-10 rounded-full border border-primary/20" alt="IA signature" />
                                        <div>
                                            <p className="text-sm font-bold">OdontoVision Specialist AI</p>
                                            <p className="text-[10px] text-muted-foreground">Certified Medical Imaging Suite</p>
                                        </div>
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
