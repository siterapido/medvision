"use client"

import { useEffect, useRef } from 'react'
import { X, AlertTriangle, AlertCircle, CheckCircle, Activity, Stethoscope, ListChecks, GitBranch } from 'lucide-react'
import { VisionDetection } from '@/lib/types/vision'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSeverityStyle, VisionSeverity } from '@/lib/constants/vision'

interface DetectionPopoverProps {
    detection: VisionDetection
    anchorPercent: { x: number; y: number } // position in % relative to image container
    containerSize: { width: number; height: number }
    onClose: () => void
}

const SEVERITY_ICON: Record<VisionSeverity, React.ElementType> = {
    critical: AlertTriangle,
    moderate: AlertCircle,
    normal: CheckCircle,
}

const significanceConfig = {
    alta: { label: 'Alta', classes: 'text-red-500 bg-red-500/10 border-red-500/30' },
    media: { label: 'Média', classes: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    baixa: { label: 'Baixa', classes: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
}

export function DetectionPopover({ detection, anchorPercent, containerSize, onClose }: DetectionPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null)
    const sev = detection.severity as VisionSeverity
    const severityStyle = getSeverityStyle(sev)
    const SeverityIcon = SEVERITY_ICON[sev] ?? CheckCircle
    const severityClasses = severityStyle.badge

    // Dismiss on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    // Click outside to close
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        // Delay to avoid triggering from the label click that opened us
        const timeout = setTimeout(() => {
            window.addEventListener('mousedown', handleClick)
        }, 100)
        return () => {
            clearTimeout(timeout)
            window.removeEventListener('mousedown', handleClick)
        }
    }, [onClose])

    // Smart positioning: decide whether to show left or right, top or bottom
    const POPOVER_APPROX_HEIGHT_PX = 380
    const popoverWidthPx = Math.max(0, Math.min(280, containerSize.width - 16))
    const anchorPxX = (anchorPercent.x / 100) * containerSize.width
    const anchorPxY = (anchorPercent.y / 100) * containerSize.height

    const showOnLeft = anchorPxX + popoverWidthPx + 8 > containerSize.width
    const showAbove = anchorPxY + POPOVER_APPROX_HEIGHT_PX + 8 > containerSize.height

    const style: React.CSSProperties = {
        position: 'absolute',
        width: `${popoverWidthPx}px`,
        maxWidth: `calc(100% - 8px)`,
        zIndex: 50,
        ...(showOnLeft
            ? { right: `${containerSize.width - anchorPxX + 4}px` }
            : { left: `${anchorPxX + 4}px` }),
        ...(showAbove
            ? { bottom: `${containerSize.height - anchorPxY + 4}px` }
            : { top: `${anchorPxY + 4}px` }),
    }

    const confidencePct = Math.round(detection.confidence * 100)

    return (
        <div
            ref={popoverRef}
            style={style}
            className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className={cn('px-3 py-2.5 border-b border-border/50 flex items-start justify-between gap-2', severityClasses.split(' ').slice(1).join(' '))}>
                <div className="flex items-center gap-2 min-w-0">
                    <SeverityIcon className={cn('w-4 h-4 shrink-0', severityClasses.split(' ')[0])} />
                    <span className={cn('text-sm font-bold truncate', severityClasses.split(' ')[0])}>
                        {detection.label}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 rounded-full opacity-70 hover:opacity-100 p-0"
                    onClick={onClose}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <div className="px-3 py-2 space-y-2.5 max-h-[320px] overflow-y-auto">
                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn('text-[10px] h-5 px-1.5', severityClasses)}>
                        {severityStyle.ptLabel}
                    </Badge>
                    {detection.toothNumber && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            Dente {detection.toothNumber}
                        </Badge>
                    )}
                    {detection.cidCode && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                            {detection.cidCode}
                        </Badge>
                    )}
                    {detection.clinicalSignificance && (
                        <Badge
                            variant="outline"
                            className={cn('text-[10px] h-5 px-1.5', significanceConfig[detection.clinicalSignificance].classes)}
                        >
                            Significância {significanceConfig[detection.clinicalSignificance].label}
                        </Badge>
                    )}
                </div>

                {/* Confidence bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Confiança
                        </span>
                        <span className={cn(
                            'text-[10px] font-bold',
                            confidencePct >= 80 ? 'text-emerald-500' : confidencePct >= 60 ? 'text-amber-500' : 'text-red-400'
                        )}>
                            {confidencePct}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all', severityStyle.label)}
                            style={{ width: `${confidencePct}%` }}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Descrição Técnica
                    </p>
                    {(detection.detailedDescription || detection.description) ? (
                        <p className="text-xs text-foreground/80 leading-relaxed">
                            {detection.detailedDescription || detection.description}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground/60 italic">Sem descrição técnica adicional disponível.</p>
                    )}
                </div>

                {/* Differential Diagnosis */}
                <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> Diagnóstico Diferencial
                    </p>
                    {detection.differentialDiagnosis && detection.differentialDiagnosis.length > 0 ? (
                        <ul className="space-y-0.5">
                            {detection.differentialDiagnosis.map((d, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1">
                                    <span className="text-primary shrink-0 mt-0.5">•</span>
                                    {d}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground/60 italic">Não informado.</p>
                    )}
                </div>

                {/* Recommended Actions */}
                <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <ListChecks className="w-3 h-3" /> Ações Recomendadas
                    </p>
                    {detection.recommendedActions && detection.recommendedActions.length > 0 ? (
                        <ol className="space-y-0.5">
                            {detection.recommendedActions.map((a, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                                    {a}
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-xs text-muted-foreground/60 italic">Nenhuma ação recomendada especificada.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
