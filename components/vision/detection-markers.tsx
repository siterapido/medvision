'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VisionDetection } from '@/lib/types/vision'
import { cn } from '@/lib/utils'
import { getSeverityStyle, VisionSeverity } from '@/lib/constants/vision'
import { 
    AlertTriangle, 
    AlertCircle, 
    CheckCircle, 
    Info, 
    Activity, 
    Stethoscope, 
    Siren,
    X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DetectionMarkersProps {
    detections: VisionDetection[]
    onMarkerClick?: (detection: VisionDetection) => void
    selectedId?: string | null
    className?: string
}

interface MarkerPosition {
    x: number
    y: number
    arrowX: number
    arrowY: number
    detection: VisionDetection
    id: string
    label: string
    confidence: number
    severity: VisionSeverity
}

const severityIcons = {
    critical: AlertTriangle,
    moderate: AlertCircle,
    normal: CheckCircle,
}

interface TooltipData {
    detection: VisionDetection
    x: number
    y: number
}

function calculateOptimalPositions(
    detections: VisionDetection[], 
    width: number, 
    height: number
): MarkerPosition[] {
    if (!detections.length || !width || !height) return []

    const sorted = [...detections].sort((a, b) => {
        const order = { critical: 0, moderate: 1, normal: 2 }
        return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    })

    const LABEL_SIZE = 7
    const PADDING = 2
    const MARGIN = 3

    const occupied: { x: number; y: number; w: number; h: number }[] = []
    
    const checkOverlap = (x: number, y: number): boolean => {
        return occupied.some(occ => 
            x < occ.x + occ.w + 0.3 &&
            x + LABEL_SIZE + 0.3 > occ.x &&
            y < occ.y + occ.h + 0.3 &&
            y + LABEL_SIZE + 0.3 > occ.y
        )
    }

    const markers: MarkerPosition[] = []
    const uniqueLabels = new Map<string, number>()

    sorted.forEach((det, idx) => {
        const cx = (det.box.xmin + det.box.xmax) / 2
        const cy = (det.box.ymin + det.box.ymax) / 2
        
        let labelNum = uniqueLabels.get(det.label.toLowerCase()) ?? 1
        uniqueLabels.set(det.label.toLowerCase(), labelNum + 1)
        
        const key = `marker-${labelNum}`
        const sev = det.severity as VisionSeverity
        
        const positions = [
            { x: det.box.xmax + PADDING, y: cy - LABEL_SIZE / 2, ax: det.box.xmax, ay: cy },
            { x: det.box.xmin - LABEL_SIZE - PADDING, y: cy - LABEL_SIZE / 2, ax: det.box.xmin, ay: cy },
            { x: cx - LABEL_SIZE / 2, y: det.box.ymax + PADDING, ax: cx, ay: det.box.ymax },
            { x: cx - LABEL_SIZE / 2, y: det.box.ymin - LABEL_SIZE - PADDING, ax: cx, ay: det.box.ymin },
        ]

        let bestPos = positions[0]
        for (const pos of positions) {
            const clampedX = Math.max(MARGIN, Math.min(pos.x, 100 - LABEL_SIZE - MARGIN))
            const clampedY = Math.max(MARGIN, Math.min(pos.y, 100 - LABEL_SIZE - MARGIN))
            if (!checkOverlap(clampedX, clampedY)) {
                bestPos = { ...pos, x: clampedX, y: clampedY }
                break
            }
        }

        if (checkOverlap(bestPos.x, bestPos.y)) {
            let stackY = MARGIN
            while (checkOverlap(MARGIN, stackY)) {
                stackY += LABEL_SIZE + 0.5
            }
            bestPos = { 
                x: MARGIN, 
                y: stackY, 
                ax: cx, 
                ay: det.box.ymin 
            }
        }

        occupied.push({ x: bestPos.x, y: bestPos.y, w: LABEL_SIZE, h: LABEL_SIZE })

        markers.push({
            x: bestPos.x,
            y: bestPos.y,
            arrowX: bestPos.ax,
            arrowY: bestPos.ay,
            detection: det,
            id: key,
            label: det.label,
            confidence: det.confidence,
            severity: sev,
        })
    })

    return markers
}

function MarkerTooltip({ data }: { data: TooltipData }) {
    const { detection, x, y } = data
    const sev = detection.severity as VisionSeverity
    const severityStyle = getSeverityStyle(sev)
    const SeverityIcon = severityIcons[sev] ?? CheckCircle

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 pointer-events-none"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translateY(calc(-100% - 12px))',
            }}
        >
            <div 
                className="w-64 sm:w-72 rounded-xl border border-border bg-card/98 backdrop-blur-lg shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={cn(
                    "px-3 py-2 flex items-center gap-2 border-b border-border/40",
                    severityStyle.badge.split(' ')[0]
                )}>
                    <SeverityIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate">{detection.label}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 rounded-full opacity-60 hover:opacity-100 p-0 ml-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>

                <div className="px-3 py-2.5 space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", severityStyle.badge)}>
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
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Confiança
                            </span>
                            <span className={cn(
                                'text-[11px] font-bold',
                                detection.confidence >= 0.8 ? 'text-emerald-500' : detection.confidence >= 0.6 ? 'text-amber-500' : 'text-red-400'
                            )}>
                                {Math.round(detection.confidence * 100)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div
                                className={cn('h-full rounded-full transition-all', severityStyle.label)}
                                style={{ width: `${detection.confidence * 100}%` }}
                            />
                        </div>
                    </div>

                    {(detection.detailedDescription || detection.description) && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" /> Descrição
                            </p>
                            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                                {detection.detailedDescription || detection.description}
                            </p>
                        </div>
                    )}

                    {detection.clinicalSignificance && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                            <Siren className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Significância:</span>
                            <span className={cn(
                                "font-medium capitalize",
                                detection.clinicalSignificance === 'alta' ? 'text-red-500' :
                                detection.clinicalSignificance === 'media' ? 'text-amber-500' :
                                'text-blue-500'
                            )}>
                                {detection.clinicalSignificance}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-3 py-2 bg-muted/20 border-t border-border/30">
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Clique para ver detalhes completos
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

export function DetectionMarkers({
    detections,
    onMarkerClick,
    selectedId,
    className,
}: DetectionMarkersProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)

    const markers = useMemo(() => {
        return calculateOptimalPositions(detections, 100, 100)
    }, [detections])

    const handleMouseEnter = useCallback((marker: MarkerPosition, e: React.MouseEvent) => {
        setHoveredId(marker.id)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setTooltipData({
            detection: marker.detection,
            x: marker.x,
            y: marker.y,
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        setHoveredId(null)
        setTooltipData(null)
    }, [])

    const handleClick = useCallback((marker: MarkerPosition, e: React.MouseEvent) => {
        e.stopPropagation()
        onMarkerClick?.(marker.detection)
    }, [onMarkerClick])

    if (!markers.length) return null

    return (
        <div className={cn("absolute inset-0 pointer-events-none overflow-visible", className)}>
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <marker
                        id="marker-arrowhead"
                        markerWidth="3"
                        markerHeight="2.5"
                        refX="2.8"
                        refY="1.25"
                        orient="auto"
                    >
                        <polygon points="0 0, 3 1.25, 0 2.5" fill="currentColor" />
                    </marker>
                </defs>
                {markers.map((marker) => {
                    const sevStyle = getSeverityStyle(marker.severity)
                    const isHovered = hoveredId === marker.id
                    const isSelected = selectedId === marker.id
                    return (
                        <motion.line
                            key={`line-${marker.id}`}
                            x1={marker.x + 3.5}
                            y1={marker.y + 3.5}
                            x2={marker.arrowX}
                            y2={marker.arrowY}
                            stroke={sevStyle.hex}
                            strokeWidth="0.4"
                            strokeDasharray="1 0.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.85 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                        />
                    )
                })}
            </svg>

            <AnimatePresence>
                {markers.map((marker) => {
                    const sevStyle = getSeverityStyle(marker.severity)
                    const SeverityIcon = severityIcons[marker.severity] ?? CheckCircle
                    const isHovered = hoveredId === marker.id
                    const isSelected = selectedId === marker.id

                    return (
                        <motion.div
                            key={marker.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.25, delay: 0.1 }}
                            className="absolute pointer-events-auto cursor-pointer"
                            style={{
                                left: `${marker.x}%`,
                                top: `${marker.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onMouseEnter={(e) => handleMouseEnter(marker, e)}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => handleClick(marker, e)}
                        >
                            <motion.div
                                animate={{
                                    scale: isHovered || isSelected ? 1.15 : 1,
                                }}
                                className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
                                    "border-2 shadow-lg transition-colors",
                                    sevStyle.border,
                                    sevStyle.bg,
                                    (isHovered || isSelected) 
                                        ? "ring-2 ring-white/70 ring-offset-2 ring-offset-black/30" 
                                        : ""
                                )}
                            >
                                <SeverityIcon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", sevStyle.text)} />
                            </motion.div>

                            <span className={cn(
                                "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
                                "text-[8px] sm:text-[9px] font-bold uppercase",
                                "bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded",
                                "opacity-0 scale-90 transition-all -top-6 sm:-top-7",
                                (isHovered || isSelected) && "opacity-100 scale-100"
                            )}>
                                <span className={sevStyle.text.replace('text-', 'text-white/90')}>
                                    {Math.round(marker.confidence * 100)}%
                                </span>
                            </span>
                        </motion.div>
                    )
                })}
            </AnimatePresence>

            <AnimatePresence>
                {tooltipData && (
                    <MarkerTooltip data={tooltipData} />
                )}
            </AnimatePresence>
        </div>
    )
}