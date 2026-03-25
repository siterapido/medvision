"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Scan, X, Check } from 'lucide-react'
import { BoundingBox } from '@/lib/types/vision'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RegionSelectorProps {
    onRegionSelected: (box: BoundingBox) => void
    onCancel: () => void
    className?: string
}

interface DragState {
    startX: number
    startY: number
    endX: number
    endY: number
}

export function RegionSelector({ onRegionSelected, onCancel, className }: RegionSelectorProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [drag, setDrag] = useState<DragState | null>(null)
    const [confirmed, setConfirmed] = useState<DragState | null>(null)

    // Convert mouse event to percentage coords relative to overlay
    const toPercent = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!overlayRef.current) return { x: 0, y: 0 }
        const rect = overlayRef.current.getBoundingClientRect()
        let clientX: number, clientY: number

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else if ('clientX' in e) {
            clientX = e.clientX
            clientY = e.clientY
        } else {
            return { x: 0, y: 0 }
        }

        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
        const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
        return { x, y }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (confirmed) return // already have a selection, reset it
        e.preventDefault()
        const pos = toPercent(e)
        setIsDragging(true)
        setDrag({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y })
        setConfirmed(null)
    }, [confirmed, toPercent])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !drag) return
        const pos = toPercent(e)
        setDrag(prev => prev ? { ...prev, endX: pos.x, endY: pos.y } : null)
    }, [isDragging, drag, toPercent])

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isDragging || !drag) return
        const pos = toPercent(e)
        const final = { ...drag, endX: pos.x, endY: pos.y }

        // Must have minimum size (2% x 2%)
        const w = Math.abs(final.endX - final.startX)
        const h = Math.abs(final.endY - final.startY)
        if (w >= 2 && h >= 2) {
            setConfirmed(final)
        }
        setDrag(final)
        setIsDragging(false)
    }, [isDragging, drag, toPercent])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // Escape to cancel
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onCancel])

    const currentDrag = confirmed || drag

    // Compute normalized rect from drag points
    const getRect = (d: DragState) => ({
        xmin: Math.min(d.startX, d.endX),
        ymin: Math.min(d.startY, d.endY),
        xmax: Math.max(d.startX, d.endX),
        ymax: Math.max(d.startY, d.endY),
    })

    const handleConfirm = () => {
        if (!confirmed) return
        const rect = getRect(confirmed)
        onRegionSelected({
            xmin: rect.xmin,
            ymin: rect.ymin,
            xmax: rect.xmax,
            ymax: rect.ymax,
        })
    }

    const handleReset = () => {
        setDrag(null)
        setConfirmed(null)
        setIsDragging(false)
    }

    const selectionRect = currentDrag ? getRect(currentDrag) : null

    return (
        <div
            ref={overlayRef}
            className={cn(
                "absolute inset-0 z-40 cursor-crosshair select-none",
                className
            )}
            onMouseDown={handleMouseDown}
        >
            {/* Instruction banner */}
            {!selectionRect && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 shadow-xl">
                        <Scan className="w-3.5 h-3.5 text-primary" />
                        Arraste para selecionar a região a refinar
                    </div>
                </div>
            )}

            {/* Dark overlay with cutout for selection */}
            {selectionRect ? (
                <>
                    {/* Top */}
                    <div
                        className="absolute bg-black/60 backdrop-blur-[1px]"
                        style={{
                            top: 0, left: 0, right: 0,
                            height: `${selectionRect.ymin}%`
                        }}
                    />
                    {/* Bottom */}
                    <div
                        className="absolute bg-black/60 backdrop-blur-[1px]"
                        style={{
                            bottom: 0, left: 0, right: 0,
                            top: `${selectionRect.ymax}%`
                        }}
                    />
                    {/* Left */}
                    <div
                        className="absolute bg-black/60 backdrop-blur-[1px]"
                        style={{
                            top: `${selectionRect.ymin}%`,
                            left: 0,
                            width: `${selectionRect.xmin}%`,
                            height: `${selectionRect.ymax - selectionRect.ymin}%`
                        }}
                    />
                    {/* Right */}
                    <div
                        className="absolute bg-black/60 backdrop-blur-[1px]"
                        style={{
                            top: `${selectionRect.ymin}%`,
                            right: 0,
                            left: `${selectionRect.xmax}%`,
                            height: `${selectionRect.ymax - selectionRect.ymin}%`
                        }}
                    />
                </>
            ) : (
                // Full dark overlay while no selection
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            )}

            {/* Selection rectangle */}
            {selectionRect && (
                <div
                    className="absolute border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                    style={{
                        left: `${selectionRect.xmin}%`,
                        top: `${selectionRect.ymin}%`,
                        width: `${selectionRect.xmax - selectionRect.xmin}%`,
                        height: `${selectionRect.ymax - selectionRect.ymin}%`,
                    }}
                >
                    {/* Corner handles */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm" />

                    {/* Size indicator */}
                    <div className="absolute -top-6 left-0 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                        {Math.round(selectionRect.xmax - selectionRect.xmin)}% × {Math.round(selectionRect.ymax - selectionRect.ymin)}%
                    </div>
                </div>
            )}

            {/* Action buttons — shown when selection exists */}
            {confirmed && (
                <div
                    className="absolute z-50 flex gap-2 pointer-events-auto"
                    style={{
                        top: `${Math.min(selectionRect!.ymax + 1, 90)}%`,
                        left: `${selectionRect!.xmin}%`,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 bg-background/90 backdrop-blur-md border-border shadow-lg"
                        onClick={handleReset}
                    >
                        <X className="w-3 h-3" />
                        Redesenhar
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 shadow-lg"
                        onClick={handleConfirm}
                    >
                        <Scan className="w-3 h-3" />
                        Re-analisar Região
                    </Button>
                </div>
            )}

            {/* Cancel button */}
            <div
                className="absolute bottom-3 right-3 z-50 pointer-events-auto"
                onClick={e => e.stopPropagation()}
            >
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 bg-background/90 backdrop-blur-md border-border shadow-lg"
                    onClick={onCancel}
                >
                    <Check className="w-3 h-3" />
                    Cancelar
                </Button>
            </div>
        </div>
    )
}
