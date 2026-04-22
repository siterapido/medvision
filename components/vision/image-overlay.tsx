"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VisionDetection, VisionAnnotation, AnnotationColor } from '@/lib/types/vision'
import { DetectionPopover } from '@/components/vision/detection-popover'
import { DetectionMarkers } from '@/components/vision/detection-markers'
import { cn } from '@/lib/utils'
import { getSeverityStyle } from '@/lib/constants/vision'

interface ImageOverlayProps {
    src: string
    detections: VisionDetection[]
    annotations?: VisionAnnotation[]
    showArrows?: boolean
    showHeatmap?: boolean
    showConfidenceFilter?: boolean
    /** Quando true, deixa margem à direita no mobile para o botão "Ferramentas" sobre a imagem. */
    reserveMobileToolbarSlot?: boolean
    /** Quando true, usa os novos DetectionMarkers com tooltip no hover */
    useModernMarkers?: boolean
    className?: string
}

const colorMap: Record<AnnotationColor, string> = {
    red: '#ef4444',
    yellow: '#eab308',
    blue: '#3b82f6',
    white: '#ffffff'
}

interface LabelPosition {
    x: number // % relative to rendered image (0-100)
    y: number // % relative to rendered image (0-100)
    arrowToX: number
    arrowToY: number
    estimatedWidth: number
}

/** Rough label width estimate in % of image space. */
function estimateLabelWidth(label: string): number {
    // Compact style: ~0.38% per char, clamped 14–36%
    return Math.min(36, Math.max(14, label.length * 0.38))
}

/**
 * Compute label positions in image-space (0–100).
 * All placements are constrained well within the image bounds.
 */
function computeLabelPositions(detections: VisionDetection[]): Map<string, LabelPosition> {
    const positions = new Map<string, LabelPosition>()
    const LABEL_H = 4.5  // label height in image-%
    const LABEL_GAP = 1.5
    const ARROW_OFF = 1.5
    const MARGIN = 2      // keep labels at least 2% from any image edge

    const sorted = [...detections].sort((a, b) => {
        const order = { critical: 0, moderate: 1, normal: 2 }
        const diff = (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
        return diff !== 0 ? diff : a.box.ymin - b.box.ymin
    })

    const placed: { x: number; y: number; w: number; h: number }[] = []

    const overlaps = (x: number, y: number, w: number) =>
        placed.some(p =>
            x < p.x + p.w + 0.5 &&
            x + w > p.x - 0.5 &&
            y < p.y + p.h + 0.5 &&
            y + LABEL_H > p.y - 0.5
        )

    for (const det of sorted) {
        const cx = (det.box.xmin + det.box.xmax) / 2
        const cy = (det.box.ymin + det.box.ymax) / 2
        const lw = estimateLabelWidth(det.label)

        // Valid placement range within image bounds
        const minX = MARGIN
        const maxX = 100 - MARGIN - lw
        const minY = MARGIN
        const maxY = 100 - MARGIN - LABEL_H

        const clampX = (v: number) => Math.max(minX, Math.min(v, maxX))
        const clampY = (v: number) => Math.max(minY, Math.min(v, maxY))

        // Candidate placements: below, above, right, left, bottom-edge, top-edge
        const candidates: { lx: number; ly: number; ax: number; ay: number }[] = [
            { lx: cx - lw / 2,              ly: det.box.ymax + ARROW_OFF,             ax: cx,            ay: det.box.ymax },
            { lx: cx - lw / 2,              ly: det.box.ymin - ARROW_OFF - LABEL_H,   ax: cx,            ay: det.box.ymin },
            { lx: det.box.xmax + ARROW_OFF, ly: cy - LABEL_H / 2,                     ax: det.box.xmax,  ay: cy },
            { lx: det.box.xmin - lw - ARROW_OFF, ly: cy - LABEL_H / 2,               ax: det.box.xmin,  ay: cy },
            { lx: cx - lw / 2,              ly: maxY,                                 ax: cx,            ay: det.box.ymax },
            { lx: cx - lw / 2,              ly: minY,                                 ax: cx,            ay: det.box.ymin },
        ]

        let chosen: { lx: number; ly: number; ax: number; ay: number } | null = null

        for (const c of candidates) {
            const lx = clampX(c.lx)
            const ly = clampY(c.ly)
            if (!overlaps(lx, ly, lw)) {
                chosen = { ...c, lx, ly }
                break
            }
        }

        // Fallback: stack below all placed labels
        if (!chosen) {
            const bottomY = placed.length > 0
                ? Math.max(...placed.map(p => p.y + p.h)) + LABEL_GAP
                : minY
            chosen = {
                lx: clampX(cx - lw / 2),
                ly: clampY(bottomY),
                ax: cx,
                ay: det.box.ymax,
            }
        }

        const fx = clampX(chosen.lx)
        const fy = clampY(chosen.ly)

        placed.push({ x: fx, y: fy, w: lw, h: LABEL_H })
        positions.set(det.id, {
            x: fx,
            y: fy,
            arrowToX: chosen.ax,
            arrowToY: chosen.ay,
            estimatedWidth: lw,
        })
    }

    return positions
}

/** Rendered image rect within its container (accounts for object-fit: contain). */
interface ImgRect { ox: number; oy: number; w: number; h: number }

export function ImageOverlay({
    src,
    detections,
    annotations = [],
    showArrows = true,
    showHeatmap = false,
    showConfidenceFilter = false,
    reserveMobileToolbarSlot = false,
    useModernMarkers = false,
    className,
}: ImageOverlayProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [minConfidence, setMinConfidence] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [imgRect, setImgRect] = useState<ImgRect>({ ox: 0, oy: 0, w: 0, h: 0 })

    // Deduplicate by label, clamp coords, filter zero-size/oversized boxes, apply confidence threshold
    const deduplicatedDetections = useMemo(() => {
        const seen = new Map<string, VisionDetection>()
        for (const det of detections) {
            // Clamp all coords to valid image space [0-100]
            const clamped = {
                ...det,
                box: {
                    xmin: Math.max(0, Math.min(100, det.box.xmin)),
                    ymin: Math.max(0, Math.min(100, det.box.ymin)),
                    xmax: Math.max(0, Math.min(100, det.box.xmax)),
                    ymax: Math.max(0, Math.min(100, det.box.ymax)),
                }
            }
            const bw = clamped.box.xmax - clamped.box.xmin
            const bh = clamped.box.ymax - clamped.box.ymin
            // Skip zero/near-zero (no box to show) or impossibly large (> 80% of image area)
            if (bw < 0.5 || bh < 0.5) continue
            if ((bw * bh) > 80 * 80) continue
            if (clamped.confidence < minConfidence) continue
            const key = clamped.label.toLowerCase().replace(/\s+/g, ' ').trim()
            const existing = seen.get(key)
            if (!existing || clamped.confidence > existing.confidence) seen.set(key, clamped)
        }
        return Array.from(seen.values())
    }, [detections, minConfidence])

    const labelPositions = useMemo(() => computeLabelPositions(deduplicatedDetections), [deduplicatedDetections])

    /**
     * Compute the pixel rect of the rendered image inside the container.
     * With object-fit: contain, the image is letterboxed — this gives us the
     * exact offset so all overlays are positioned correctly over the image pixels.
     */
    const computeImgRect = useCallback(() => {
        const img = imgRef.current
        const container = containerRef.current
        if (!img || !container) return
        const nw = img.naturalWidth || img.offsetWidth
        const nh = img.naturalHeight || img.offsetHeight
        if (!nw || !nh) return
        const cw = container.offsetWidth
        const ch = container.offsetHeight
        const scale = Math.min(cw / nw, ch / nh)
        const rw = Math.round(nw * scale)
        const rh = Math.round(nh * scale)
        setImgRect({
            ox: Math.round((cw - rw) / 2),
            oy: Math.round((ch - rh) / 2),
            w: rw,
            h: rh,
        })
    }, [])

    // Recompute on container resize
    useEffect(() => {
        const observer = new ResizeObserver(computeImgRect)
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [computeImgRect])

    // Escape key closes popover
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null) }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    const handleDetectionClick = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedId(prev => prev === id ? null : id)
    }, [])

    const closePopover = useCallback(() => setSelectedId(null), [])

    // Draw user annotations on canvas (in image space)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || imgRect.w === 0 || annotations.length === 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, imgRect.w, imgRect.h)
        for (const annotation of annotations) {
            const color = colorMap[annotation.color]
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            switch (annotation.tool) {
                case 'pen':
                    if (annotation.points?.length) {
                        ctx.beginPath()
                        ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
                        for (let i = 1; i < annotation.points.length; i++) ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
                        ctx.stroke()
                    }
                    break
                case 'circle':
                    if (annotation.start && annotation.end) {
                        const rx = Math.abs(annotation.end.x - annotation.start.x) / 2
                        const ry = Math.abs(annotation.end.y - annotation.start.y) / 2
                        ctx.beginPath()
                        ctx.ellipse((annotation.start.x + annotation.end.x) / 2, (annotation.start.y + annotation.end.y) / 2, rx, ry, 0, 0, Math.PI * 2)
                        ctx.stroke()
                    }
                    break
                case 'arrow':
                    if (annotation.start && annotation.end) {
                        const { start, end } = annotation
                        const angle = Math.atan2(end.y - start.y, end.x - start.x)
                        const hl = 15
                        ctx.beginPath()
                        ctx.moveTo(start.x, start.y)
                        ctx.lineTo(end.x, end.y)
                        ctx.stroke()
                        ctx.beginPath()
                        ctx.moveTo(end.x, end.y)
                        ctx.lineTo(end.x - hl * Math.cos(angle - Math.PI / 6), end.y - hl * Math.sin(angle - Math.PI / 6))
                        ctx.moveTo(end.x, end.y)
                        ctx.lineTo(end.x - hl * Math.cos(angle + Math.PI / 6), end.y - hl * Math.sin(angle + Math.PI / 6))
                        ctx.stroke()
                    }
                    break
                case 'text':
                    if (annotation.start && annotation.text) {
                        ctx.font = 'bold 16px system-ui'
                        const metrics = ctx.measureText(annotation.text)
                        const p = 4
                        ctx.fillStyle = 'rgba(0,0,0,0.7)'
                        ctx.fillRect(annotation.start.x - p, annotation.start.y - 16 - p, metrics.width + p * 2, 20 + p * 2)
                        ctx.fillStyle = color
                        ctx.fillText(annotation.text, annotation.start.x, annotation.start.y)
                    }
                    break
            }
        }
    }, [annotations, imgRect])

    const selectedDetection = selectedId ? deduplicatedDetections.find(d => d.id === selectedId) : null
    const selectedLabelPos = selectedId ? labelPositions.get(selectedId) : null

    // Heatmap in image-space %
    const heatmapData = useMemo(() => {
        if (!showHeatmap || deduplicatedDetections.length === 0) return null
        const gridSize = 20
        const grid: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
        deduplicatedDetections.forEach(det => {
            const sw = det.severity === 'critical' ? 1.0 : det.severity === 'moderate' ? 0.6 : 0.3
            const cw = det.confidence ?? 0.8
            const sx = Math.floor((det.box.xmin / 100) * gridSize)
            const ex = Math.ceil((det.box.xmax / 100) * gridSize)
            const sy = Math.floor((det.box.ymin / 100) * gridSize)
            const ey = Math.ceil((det.box.ymax / 100) * gridSize)
            for (let x = sx; x < ex && x < gridSize; x++) {
                for (let y = sy; y < ey && y < gridSize; y++) {
                    const d = Math.sqrt(
                        Math.pow((x - (sx + ex) / 2) / ((ex - sx) || 1), 2) +
                        Math.pow((y - (sy + ey) / 2) / ((ey - sy) || 1), 2)
                    )
                    grid[y][x] += sw * cw * Math.max(0, 1 - d * 0.5)
                }
            }
        })
        return grid
    }, [deduplicatedDetections, showHeatmap])

    return (
        <div ref={containerRef} className={cn("relative w-full h-full group select-none overflow-hidden", className)}>
            {/* Base image — we track it to compute rendered bounds */}
            <img
                ref={imgRef}
                src={src}
                alt="Analyzed"
                className="w-full h-full object-contain pointer-events-none"
                onLoad={computeImgRect}
            />

            {/* Confidence threshold slider — mobile: barra inferior; md+: canto superior direito */}
            {showConfidenceFilter && detections.length > 0 && (
                <div
                    className={cn(
                        'absolute z-40 flex bg-black/60 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 pointer-events-auto select-none',
                        'bottom-2 left-2 flex-col gap-1 min-w-0',
                        reserveMobileToolbarSlot ? 'right-14' : 'right-2',
                        'md:bottom-auto md:left-auto md:right-2 md:top-2 md:flex-row md:items-center md:gap-2 md:w-auto md:max-w-[min(100%,18rem)]'
                    )}
                    title="Filtrar detecções por confiança mínima"
                >
                    <span className="text-[10px] text-white/70 shrink-0 md:whitespace-nowrap">Confiança mín.</span>
                    <div className="flex items-center gap-2 min-w-0 w-full md:w-auto">
                        <input
                            type="range"
                            min={0}
                            max={0.95}
                            step={0.05}
                            value={minConfidence}
                            onChange={e => setMinConfidence(Number(e.target.value))}
                            className="min-w-0 flex-1 h-2 md:w-20 md:flex-none accent-primary cursor-pointer"
                            title={`Mínimo: ${Math.round(minConfidence * 100)}%`}
                        />
                        <span className="text-[10px] font-mono text-white w-8 shrink-0 text-right tabular-nums">
                            {Math.round(minConfidence * 100)}%
                        </span>
                    </div>
                </div>
            )}

            {/*
              ─────────────────────────────────────────────────────────────────
              IMAGE-SPACE OVERLAY WRAPPER
              Positioned exactly over the rendered image pixels (not the full
              container). All detection boxes, arrows, labels and annotations
              live inside here, so their % coords map directly to the image.
              ─────────────────────────────────────────────────────────────────
            */}
            {/* Empty state: all detections filtered by confidence slider */}
            {detections.length > 0 && deduplicatedDetections.length === 0 && imgRect.w > 0 && (
                <div
                    className="absolute flex items-center justify-center pointer-events-none"
                    style={{ left: imgRect.ox, top: imgRect.oy, width: imgRect.w, height: imgRect.h }}
                >
                    <div className="bg-black/70 backdrop-blur-md px-4 py-3 rounded-xl text-center space-y-1 border border-white/10">
                        <p className="text-white text-sm font-semibold">Nenhuma detecção visível</p>
                        <p className="text-white/60 text-xs">Reduza o limiar de confiança para ver mais resultados</p>
                    </div>
                </div>
            )}

            {imgRect.w > 0 && (
                <div
                    className="absolute overflow-visible"
                    style={{
                        left: imgRect.ox,
                        top: imgRect.oy,
                        width: imgRect.w,
                        height: imgRect.h,
                        pointerEvents: 'none',
                    }}
                >
                    {/* Heatmap layer */}
                    {heatmapData && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {heatmapData.map((row, y) =>
                                row.map((value, x) => {
                                    if (value < 0.1) return null
                                    return (
                                        <div
                                            key={`${x}-${y}`}
                                            className="absolute"
                                            style={{
                                                left: `${(x / 20) * 100}%`,
                                                top: `${(y / 20) * 100}%`,
                                                width: '5%', height: '5%',
                                                backgroundColor: `rgba(239,68,68,${Math.min(value * 0.4, 0.7)})`,
                                                borderRadius: 2,
                                            }}
                                        />
                                    )
                                })
                            )}
                        </div>
                    )}

                    {/* Modern Detection Markers - estilo radiology profissional */}
                    {useModernMarkers && deduplicatedDetections.length > 0 && (
                        <DetectionMarkers
                            detections={deduplicatedDetections}
                            onMarkerClick={(det) => setSelectedId(prev => prev === det.id ? null : det.id)}
                            selectedId={selectedId}
                            className="absolute inset-0"
                        />
                    )}

                    {/* Annotations canvas */}
                    {annotations.length > 0 && (
                        <canvas
                            ref={canvasRef}
                            width={imgRect.w}
                            height={imgRect.h}
                            className="absolute inset-0 pointer-events-none"
                        />
                    )}

                    {/* Detection boxes */}
                    <div className="absolute inset-0 overflow-hidden">
                        <AnimatePresence>
                            {deduplicatedDetections.map((det) => {
                                const sevStyle = getSeverityStyle(det.severity)
                                const isHovered = hoveredId === det.id
                                const isSelected = selectedId === det.id
                                return (
                                    <motion.div
                                        key={det.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className={cn(
                                            "absolute border-2 cursor-pointer transition-all duration-300 z-10",
                                            sevStyle.border, sevStyle.bg,
                                            (isHovered || isSelected) ? "z-50 shadow-[0_0_20px_rgba(0,0,0,0.3)] ring-2 ring-white/50" : ""
                                        )}
                                        style={{
                                            top: `${det.box.ymin}%`,
                                            left: `${det.box.xmin}%`,
                                            width: `${det.box.xmax - det.box.xmin}%`,
                                            height: `${det.box.ymax - det.box.ymin}%`,
                                        }}
                                        onMouseEnter={() => setHoveredId(det.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={(e) => handleDetectionClick(det.id, e)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDetectionClick(det.id, e as unknown as React.MouseEvent) } }}
                                    >
                                        <div className={cn("absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2", sevStyle.border)} />
                                        <div className={cn("absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2", sevStyle.border)} />
                                        <div className={cn("absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2", sevStyle.border)} />
                                        <div className={cn("absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2", sevStyle.border)} />
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    {/* SVG Arrow lines — viewBox 0 0 100 100 = image space */}
                    {showArrows && deduplicatedDetections.length > 0 && (
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none z-20"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                {deduplicatedDetections.map((det) => {
                                    const color = getSeverityStyle(det.severity).hex
                                    return (
                                        <marker key={`arrow-${det.id}`} id={`arrowhead-${det.id}`}
                                            markerWidth="3" markerHeight="2.5" refX="2.8" refY="1.25" orient="auto"
                                        >
                                            <polygon points="0 0, 3 1.25, 0 2.5" fill={color} />
                                        </marker>
                                    )
                                })}
                            </defs>
                            {deduplicatedDetections.map((det, i) => {
                                const pos = labelPositions.get(det.id)
                                if (!pos) return null
                                const color = getSeverityStyle(det.severity).hex
                                const labelCx = pos.x + pos.estimatedWidth / 2
                                const labelCy = pos.y + 2.25
                                const arrowStartX = pos.arrowToX > labelCx ? pos.x + pos.estimatedWidth : pos.x
                                const arrowStartY = pos.arrowToY > labelCy ? pos.y + 4.5 : pos.y
                                return (
                                    <motion.line
                                        key={`line-${det.id}`}
                                        x1={arrowStartX} y1={arrowStartY}
                                        x2={pos.arrowToX} y2={pos.arrowToY}
                                        stroke={color} strokeWidth="0.4" strokeDasharray="1 0.5"
                                        markerEnd={`url(#arrowhead-${det.id})`}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.9 }}
                                        transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                                    />
                                )
                            })}
                        </svg>
                    )}

                    {/* Floating labels — compact style */}
                    {showArrows && (
                        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                            <AnimatePresence>
                                {deduplicatedDetections.map((det, i) => {
                                    const pos = labelPositions.get(det.id)
                                    if (!pos) return null
                                    const sevStyle = getSeverityStyle(det.severity)
                                    const isHovered = hoveredId === det.id
                                    const isSelected = selectedId === det.id
                                    return (
                                        <motion.div
                                            key={`label-${det.id}`}
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
                                            className={cn(
                                                "absolute px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold text-white uppercase tracking-normal shadow-md pointer-events-auto cursor-pointer select-none",
                                                "whitespace-normal break-words sm:whitespace-nowrap",
                                                sevStyle.label,
                                                (isHovered || isSelected) ? "ring-2 ring-white/80 scale-105" : ""
                                            )}
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, maxWidth: 'min(40%, 92%)' }}
                                            onMouseEnter={() => setHoveredId(det.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            onClick={(e) => handleDetectionClick(det.id, e)}
                                            title={`${det.label} — ${Math.round(det.confidence * 100)}% — Clique para detalhes`}
                                        >
                                            <span className="block line-clamp-2 sm:line-clamp-none sm:truncate sm:max-w-full">
                                                {det.label}
                                                <span className="ml-1 opacity-75 font-normal">{Math.round(det.confidence * 100)}%</span>
                                            </span>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Detection Popover — overflow visible so it can extend past image bounds */}
                    <AnimatePresence>
                        {selectedDetection && selectedLabelPos && (
                            <motion.div
                                key={`popover-${selectedDetection.id}`}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ duration: 0.15 }}
                                className="absolute inset-0 z-40 pointer-events-none overflow-visible"
                            >
                                <div className="pointer-events-auto w-full h-full overflow-visible">
                                    <DetectionPopover
                                        detection={selectedDetection}
                                        anchorPercent={{ x: selectedLabelPos.x, y: selectedLabelPos.y }}
                                        containerSize={{ width: imgRect.w, height: imgRect.h }}
                                        onClose={closePopover}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
