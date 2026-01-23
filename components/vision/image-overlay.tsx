"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VisionDetection } from '@/lib/types/vision'
import { cn } from '@/lib/utils'

interface ImageOverlayProps {
    src: string
    detections: VisionDetection[]
    className?: string
}

export function ImageOverlay({ src, detections, className }: ImageOverlayProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    const getColor = (severity: string) => {
        switch (severity) {
            case 'critical': return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'bg-red-500', shadow: 'shadow-red-500/50' }
            case 'moderate': return { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'bg-amber-500', shadow: 'shadow-amber-500/50' }
            case 'normal': return { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'bg-blue-500', shadow: 'shadow-blue-500/50' }
            default: return { border: 'border-gray-500', bg: 'bg-gray-500/20', text: 'bg-gray-500', shadow: 'shadow-gray-500/50' }
        }
    }

    return (
        <div className={cn("relative w-full h-full group select-none", className)}>
            <img
                src={src}
                alt="Analyzed"
                className="w-full h-full object-contain pointer-events-none"
            />

            {/* SVG Overlay layer for cleaner lines if needed, but using Absolute divs for easy interaction */}
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
