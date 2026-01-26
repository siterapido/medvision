'use client'

import { motion } from 'motion/react'
import {
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle2,
    ImageIcon,
    Sun,
    Contrast,
    ArrowRight
} from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    ImageQualityResult,
    ImageQualityWarning,
    getSeverityColor,
    getSeverityBg
} from '@/lib/utils/image-quality-validator'
import { cn } from '@/lib/utils'

interface QualityFeedbackProps {
    result: ImageQualityResult
    imagePreview: string
    onProceed: () => void
    onCancel: () => void
}

function getWarningIcon(type: ImageQualityWarning['type']) {
    switch (type) {
        case 'low_resolution': return ImageIcon
        case 'too_dark':
        case 'too_bright': return Sun
        case 'low_contrast': return Contrast
        case 'aspect_ratio': return ImageIcon
        default: return AlertCircle
    }
}

function getSeverityIcon(severity: 'low' | 'medium' | 'high') {
    switch (severity) {
        case 'high': return AlertTriangle
        case 'medium': return AlertCircle
        case 'low': return Info
    }
}

export function QualityFeedback({ result, imagePreview, onProceed, onCancel }: QualityFeedbackProps) {
    const { warnings, metrics, isValid, canProceed } = result

    // Calculate quality score (0-100)
    const qualityScore = Math.max(0, 100 - (warnings.reduce((acc, w) => {
        if (w.severity === 'high') return acc + 40
        if (w.severity === 'medium') return acc + 20
        return acc + 10
    }, 0)))

    const scoreColor = qualityScore >= 80 ? 'text-green-500' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'
    const scoreLabel = qualityScore >= 80 ? 'Boa' : qualityScore >= 50 ? 'Aceitável' : 'Baixa'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
        >
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                        "p-2 rounded-xl border",
                        isValid ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"
                    )}>
                        {isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-heading font-bold">
                            {isValid ? 'Imagem Aprovada' : 'Verificação de Qualidade'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {isValid ? 'A imagem atende aos requisitos' : 'Alguns pontos precisam de atenção'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Preview */}
                    <div className="space-y-4">
                        <div className="aspect-video rounded-xl overflow-hidden bg-black/20 border border-border/50">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Quality Score */}
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Qualidade da Imagem</span>
                                <span className={cn("text-lg font-bold", scoreColor)}>
                                    {qualityScore}% - {scoreLabel}
                                </span>
                            </div>
                            <Progress value={qualityScore} className="h-2" />
                        </div>
                    </div>

                    {/* Warnings & Metrics */}
                    <div className="space-y-4">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Resolução</p>
                                <p className="text-sm font-medium">{metrics.width} x {metrics.height}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Brilho</p>
                                <p className="text-sm font-medium">{metrics.brightness}/255</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Contraste</p>
                                <p className="text-sm font-medium">{metrics.contrast}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Proporção</p>
                                <p className="text-sm font-medium">{metrics.aspectRatio}:1</p>
                            </div>
                        </div>

                        {/* Warnings List */}
                        {warnings.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Avisos Detectados
                                </h4>
                                {warnings.map((warning, i) => {
                                    const Icon = getWarningIcon(warning.type)
                                    const SeverityIcon = getSeverityIcon(warning.severity)
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "p-3 rounded-lg border flex items-start gap-3",
                                                getSeverityBg(warning.severity)
                                            )}
                                        >
                                            <SeverityIcon className={cn("w-4 h-4 shrink-0 mt-0.5", getSeverityColor(warning.severity))} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-medium", getSeverityColor(warning.severity))}>
                                                    {warning.message}
                                                </p>
                                            </div>
                                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Success message if no warnings */}
                        {warnings.length === 0 && (
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <p className="text-sm text-green-600 font-medium">
                                    Imagem com ótima qualidade para análise!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6 pt-4 border-t border-border/30">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                        onClick={onCancel}
                    >
                        Escolher Outra Imagem
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 h-12 rounded-xl gap-2",
                            canProceed ? "bg-primary hover:bg-primary/90" : "bg-amber-600 hover:bg-amber-700"
                        )}
                        onClick={onProceed}
                    >
                        {canProceed ? 'Prosseguir' : 'Prosseguir Mesmo Assim'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                {!canProceed && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                        A análise pode ter resultados imprecisos devido à qualidade da imagem
                    </p>
                )}
            </GlassCard>
        </motion.div>
    )
}
