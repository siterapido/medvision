"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VisionDetection, VisionAnnotation, AnnotationColor } from '@/lib/types/vision'
import { cn } from '@/lib/utils'

interface ImageOverlayProps {
    src: string
    detections: VisionDetection[]
    annotations?: VisionAnnotation[]
    className?: string
}

const colorMap: Record<AnnotationColor, string> = {
    red: '#ef4444',
    yellow: '#eab308',
    blue: '#3b82f6',
    white: '#ffffff'
}

export function ImageOverlay({ src, detections, annotations = [], className }: ImageOverlayProps) {
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

    // Draw annotations on canvas
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

                        // Convert coordinates to percentages
                        // box: [ymin, xmin, ymax, xmax] 0-100
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

                                {/* Floating Label */}
                                <div className={cn(
                                    "absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap shadow-sm transition-all duration-300",
                                    colors.text,
                                    (isHovered || det.severity === 'critical') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                )}>
                                    {det.label}
                                    {isHovered && <span className="ml-1 opacity-80 font-normal">| {Math.round(det.confidence * 100)}%</span>}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
