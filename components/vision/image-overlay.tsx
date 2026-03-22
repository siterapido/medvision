"use client"

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VisionDetection, VisionAnnotation, AnnotationColor } from '@/lib/types/vision'
import { cn } from '@/lib/utils'

interface ImageOverlayProps {
    src: string
    detections: VisionDetection[]
    annotations?: VisionAnnotation[]
    showArrows?: boolean
    className?: string
}

const colorMap: Record<AnnotationColor, string> = {
    red: '#ef4444',
    yellow: '#eab308',
    blue: '#3b82f6',
    white: '#ffffff'
}

const severityColorHex: Record<string, string> = {
    critical: '#ef4444',
    moderate: '#f59e0b',
    normal: '#3b82f6',
}

interface LabelPosition {
    x: number // percentage 0-100
    y: number // percentage 0-100
    arrowToX: number // point on box edge
    arrowToY: number
}

/**
 * Compute label positions outside the detection box with collision avoidance.
 */
function computeLabelPositions(detections: VisionDetection[]): Map<string, LabelPosition> {
    const positions = new Map<string, LabelPosition>()
    const LABEL_HEIGHT = 4 // approximate label height in % units
    const LABEL_GAP = 1.5
    const ARROW_OFFSET = 3 // offset from box edge

    // Sort by ymin to process top-to-bottom
    const sorted = [...detections].sort((a, b) => a.box.ymin - b.box.ymin)
    const usedYRanges: { y: number; height: number }[] = []

    for (const det of sorted) {
        const boxCenterX = (det.box.xmin + det.box.xmax) / 2
        const boxCenterY = (det.box.ymin + det.box.ymax) / 2

        // Determine label placement: above or below the box
        let labelY: number
        let arrowToY: number

        if (det.box.ymin > 18) {
            // Place above
            labelY = det.box.ymin - ARROW_OFFSET - LABEL_HEIGHT
            arrowToY = det.box.ymin
        } else {
            // Place below
            labelY = det.box.ymax + ARROW_OFFSET
            arrowToY = det.box.ymax
        }

        // Determine X: offset away from center to reduce overlap
        let labelX: number
        if (boxCenterX < 40) {
            // Box on left side, place label to the right
            labelX = Math.min(det.box.xmax + 2, 70)
        } else if (boxCenterX > 60) {
            // Box on right side, place label to the left
            labelX = Math.max(det.box.xmin - 25, 2)
        } else {
            // Center - place above/below aligned
            labelX = Math.max(2, Math.min(boxCenterX - 10, 70))
        }

        // Collision avoidance with previously placed labels
        for (const used of usedYRanges) {
            if (Math.abs(labelY - used.y) < LABEL_HEIGHT + LABEL_GAP) {
                labelY = used.y + used.height + LABEL_GAP
            }
        }

        // Clamp to bounds
        labelY = Math.max(1, Math.min(labelY, 92))
        labelX = Math.max(1, Math.min(labelX, 75))

        // Arrow target: nearest box edge point
        const arrowToX = boxCenterX

        usedYRanges.push({ y: labelY, height: LABEL_HEIGHT })
        positions.set(det.id, { x: labelX, y: labelY, arrowToX, arrowToY })
    }

    return positions
}

export function ImageOverlay({ src, detections, annotations = [], showArrows = true, className }: ImageOverlayProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })

    const getColor = (severity: string) => {
        switch (severity) {
            case 'critical': return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'bg-red-500', shadow: 'shadow-red-500/50' }
            case 'moderate': return { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'bg-amber-500', shadow: 'shadow-amber-500/50' }
            case 'normal': return { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'bg-blue-500', shadow: 'shadow-blue-500/50' }
            default: return { border: 'border-gray-500', bg: 'bg-gray-500/20', text: 'bg-gray-500', shadow: 'shadow-gray-500/50' }
        }
    }

    // Compute label positions with collision avoidance
    const labelPositions = useMemo(() => computeLabelPositions(detections), [detections])

    // Update size when container changes
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                })
            }
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // Draw user annotations on canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || size.width === 0 || annotations.length === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, size.width, size.height)

        for (const annotation of annotations) {
            const color = colorMap[annotation.color]
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            switch (annotation.tool) {
                case 'pen':
                    if (annotation.points && annotation.points.length > 0) {
                        ctx.beginPath()
                        ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
                        for (let i = 1; i < annotation.points.length; i++) {
                            ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
                        }
                        ctx.stroke()
                    }
                    break

                case 'circle':
                    if (annotation.start && annotation.end) {
                        const radiusX = Math.abs(annotation.end.x - annotation.start.x) / 2
                        const radiusY = Math.abs(annotation.end.y - annotation.start.y) / 2
                        const centerX = (annotation.start.x + annotation.end.x) / 2
                        const centerY = (annotation.start.y + annotation.end.y) / 2
                        ctx.beginPath()
                        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
                        ctx.stroke()
                    }
                    break

                case 'arrow':
                    if (annotation.start && annotation.end) {
                        const { start, end } = annotation
                        ctx.beginPath()
                        ctx.moveTo(start.x, start.y)
                        ctx.lineTo(end.x, end.y)
                        ctx.stroke()

                        const angle = Math.atan2(end.y - start.y, end.x - start.x)
                        const headLength = 15
                        ctx.beginPath()
                        ctx.moveTo(end.x, end.y)
                        ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6))
                        ctx.moveTo(end.x, end.y)
                        ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6))
                        ctx.stroke()
                    }
                    break

                case 'text':
                    if (annotation.start && annotation.text) {
                        ctx.font = 'bold 16px system-ui'
                        const metrics = ctx.measureText(annotation.text)
                        const padding = 4
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
                        ctx.fillRect(annotation.start.x - padding, annotation.start.y - 16 - padding, metrics.width + padding * 2, 20 + padding * 2)
                        ctx.fillStyle = color
                        ctx.fillText(annotation.text, annotation.start.x, annotation.start.y)
                    }
                    break
            }
        }
    }, [annotations, size])

    return (
        <div ref={containerRef} className={cn("relative w-full h-full group select-none", className)}>
            <img
                src={src}
                alt="Analyzed"
                className="w-full h-full object-contain pointer-events-none"
            />

            {/* Annotations canvas */}
            {annotations.length > 0 && size.width > 0 && (
                <canvas
                    ref={canvasRef}
                    width={size.width}
                    height={size.height}
                    className="absolute inset-0 pointer-events-none"
                />
            )}

            {/* Detection boxes layer */}
            <div className="absolute inset-0">
                <AnimatePresence>
                    {detections.map((det) => {
                        const colors = getColor(det.severity)
                        const isHovered = hoveredId === det.id

                        const top = `${det.box.ymin}%`
                        const left = `${det.box.xmin}%`
                        const width = `${det.box.xmax - det.box.xmin}%`
                        const height = `${det.box.ymax - det.box.ymin}%`

                        return (
                            <motion.div
                                key={det.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className={cn(
                                    "absolute border-2 cursor-pointer transition-all duration-300 z-10",
                                    colors.border,
                                    colors.bg,
                                    isHovered ? "z-50 shadow-[0_0_20px_rgba(0,0,0,0.3)] ring-2 ring-white/50" : ""
                                )}
                                style={{ top, left, width, height }}
                                onMouseEnter={() => setHoveredId(det.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* corner markers */}
                                <div className={cn("absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2", colors.border)} />
                                <div className={cn("absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2", colors.border)} />
                                <div className={cn("absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2", colors.border)} />
                                <div className={cn("absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2", colors.border)} />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* SVG Arrow lines layer */}
            {showArrows && detections.length > 0 && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        {detections.map((det) => {
                            const color = severityColorHex[det.severity] || '#9ca3af'
                            return (
                                <marker
                                    key={`arrow-${det.id}`}
                                    id={`arrowhead-${det.id}`}
                                    markerWidth="3"
                                    markerHeight="2.5"
                                    refX="2.8"
                                    refY="1.25"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 3 1.25, 0 2.5"
                                        fill={color}
                                    />
                                </marker>
                            )
                        })}
                    </defs>
                    {detections.map((det, i) => {
                        const pos = labelPositions.get(det.id)
                        if (!pos) return null

                        const color = severityColorHex[det.severity] || '#9ca3af'
                        // Arrow start: from label center bottom/top
                        const labelCenterX = pos.x + 10 // approximate label half-width in %
                        const isAbove = pos.y < det.box.ymin
                        const arrowStartY = isAbove ? pos.y + 3.5 : pos.y
                        const arrowEndY = pos.arrowToY

                        return (
                            <motion.line
                                key={`line-${det.id}`}
                                x1={labelCenterX}
                                y1={arrowStartY}
                                x2={pos.arrowToX}
                                y2={arrowEndY}
                                stroke={color}
                                strokeWidth="0.4"
                                strokeDasharray="1 0.5"
                                markerEnd={`url(#arrowhead-${det.id})`}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.9 }}
                                transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                            />
                        )
                    })}
                </svg>
            )}

            {/* Floating labels layer (outside boxes, with arrows) */}
            {showArrows && (
                <div className="absolute inset-0 pointer-events-none z-30">
                    <AnimatePresence>
                        {detections.map((det, i) => {
                            const pos = labelPositions.get(det.id)
                            if (!pos) return null

                            const colors = getColor(det.severity)
                            const isHovered = hoveredId === det.id

                            return (
                                <motion.div
                                    key={`label-${det.id}`}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                                    className={cn(
                                        "absolute px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap shadow-lg pointer-events-auto cursor-default",
                                        colors.text,
                                        isHovered ? "ring-1 ring-white/60 scale-105" : ""
                                    )}
                                    style={{
                                        left: `${pos.x}%`,
                                        top: `${pos.y}%`,
                                    }}
                                    onMouseEnter={() => setHoveredId(det.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {det.label}
                                    <span className="ml-1.5 opacity-75 font-normal text-[9px]">
                                        {Math.round(det.confidence * 100)}%
                                    </span>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
