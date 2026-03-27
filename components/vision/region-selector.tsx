"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Scan, X, Check, AlertTriangle } from 'lucide-react'
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
    const [tooSmall, setTooSmall] = useState(false)

    // Convert mouse/touch event to percentage coords relative to overlay
    const toPercent = useCallback((clientX: number, clientY: number) => {
        if (!overlayRef.current) return { x: 0, y: 0 }
        const rect = overlayRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
        const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
        return { x, y }
    }, [])

    const startDrag = useCallback((clientX: number, clientY: number) => {
        const pos = toPercent(clientX, clientY)
        setIsDragging(true)
        setDrag({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y })
        setConfirmed(null)
        setTooSmall(false)
    }, [toPercent])

    const moveDrag = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return
        const pos = toPercent(clientX, clientY)
        setDrag(prev => prev ? { ...prev, endX: pos.x, endY: pos.y } : null)
    }, [isDragging, toPercent])

    const endDrag = useCallback((clientX: number, clientY: number) => {
        if (!isDragging || !drag) return
        const pos = toPercent(clientX, clientY)
        const final = { ...drag, endX: pos.x, endY: pos.y }
        const w = Math.abs(final.endX - final.startX)
        const h = Math.abs(final.endY - final.startY)
        if (w >= 2 && h >= 2) {
            setConfirmed(final)
            setTooSmall(false)
        } else {
            setTooSmall(true)
            setDrag(null)
        }
        setIsDragging(false)
    }, [isDragging, drag, toPercent])

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (confirmed) return
        e.preventDefault()
        startDrag(e.clientX, e.clientY)
    }, [confirmed, startDrag])

    const handleMouseMove = useCallback((e: MouseEvent) => moveDrag(e.clientX, e.clientY), [moveDrag])
    const handleMouseUp = useCallback((e: MouseEvent) => endDrag(e.clientX, e.clientY), [endDrag])

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (confirmed) return
        e.preventDefault()
        const t = e.touches[0]
        startDrag(t.clientX, t.clientY)
    }, [confirmed, startDrag])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        const t = e.touches[0]
        if (t) moveDrag(t.clientX, t.clientY)
    }, [moveDrag])

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        const t = e.changedTouches[0]
        if (t) endDrag(t.clientX, t.clientY)
    }, [endDrag])

    // Attach/detach window-level drag listeners
    useEffect(() => {
        if (!isDragging) return
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('touchmove', handleTouchMove, { passive: true })
        window.addEventListener('touchend', handleTouchEnd)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

    // Auto-clear "too small" warning
    useEffect(() => {
        if (!tooSmall) return
        const t = setTimeout(() => setTooSmall(false), 2500)
        return () => clearTimeout(t)
    }, [tooSmall])

    // Escape to cancel
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onCancel])

    const currentDrag = confirmed || drag

    const getRect = (d: DragState) => ({
        xmin: Math.min(d.startX, d.endX),
        ymin: Math.min(d.startY, d.endY),
        xmax: Math.max(d.startX, d.endX),
        ymax: Math.max(d.startY, d.endY),
    })

    const handleConfirm = () => {
        if (!confirmed) return
        const rect = getRect(confirmed)
        onRegionSelected({ xmin: rect.xmin, ymin: rect.ymin, xmax: rect.xmax, ymax: rect.ymax })
    }

    const handleReset = () => {
        setDrag(null)
        setConfirmed(null)
        setIsDragging(false)
        setTooSmall(false)
    }

    const selectionRect = currentDrag ? getRect(currentDrag) : null

    return (
        <div
            ref={overlayRef}
            className={cn("absolute inset-0 z-40 cursor-crosshair select-none touch-none", className)}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            role="dialog"
            aria-label="Selecione uma região da imagem para análise detalhada"
        >
            {/* Instruction banner */}
            {!selectionRect && !tooSmall && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 shadow-xl">
                        <Scan className="w-3.5 h-3.5 text-primary" />
                        Arraste para selecionar a região a refinar
                    </div>
                </div>
            )}

            {/* Too small warning */}
            {tooSmall && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="flex items-center gap-2 bg-amber-500/90 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-amber-400/50 shadow-xl">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Selecione uma área maior para refinar
                    </div>
                </div>
            )}

            {/* Dark overlay with cutout for selection */}
            {selectionRect ? (
                <>
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ top: 0, left: 0, right: 0, height: `${selectionRect.ymin}%` }} />
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ bottom: 0, left: 0, right: 0, top: `${selectionRect.ymax}%` }} />
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ top: `${selectionRect.ymin}%`, left: 0, width: `${selectionRect.xmin}%`, height: `${selectionRect.ymax - selectionRect.ymin}%` }} />
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ top: `${selectionRect.ymin}%`, right: 0, left: `${selectionRect.xmax}%`, height: `${selectionRect.ymax - selectionRect.ymin}%` }} />
                </>
            ) : (
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
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm" />
                    <div className="absolute -top-6 left-0 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                        {Math.round(selectionRect.xmax - selectionRect.xmin)}% × {Math.round(selectionRect.ymax - selectionRect.ymin)}%
                    </div>
                </div>
            )}

            {/* Action buttons */}
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
            <div className="absolute bottom-3 right-3 z-50 pointer-events-auto" onClick={e => e.stopPropagation()}>
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
