'use client'

import { useState, useCallback } from 'react'
import { VisionAnnotation, AnnotationTool, AnnotationColor } from '@/lib/types/vision'

interface UseAnnotationsReturn {
    annotations: VisionAnnotation[]
    currentAnnotation: Partial<VisionAnnotation> | null
    activeTool: AnnotationTool
    activeColor: AnnotationColor
    canUndo: boolean
    canRedo: boolean
    setActiveTool: (tool: AnnotationTool) => void
    setActiveColor: (color: AnnotationColor) => void
    startAnnotation: (point: { x: number; y: number }) => void
    updateAnnotation: (point: { x: number; y: number }) => void
    finishAnnotation: (text?: string) => void
    cancelAnnotation: () => void
    undo: () => void
    redo: () => void
    clear: () => void
    setAnnotations: (annotations: VisionAnnotation[]) => void
}

export function useAnnotations(initialAnnotations: VisionAnnotation[] = []): UseAnnotationsReturn {
    const [annotations, setAnnotationsState] = useState<VisionAnnotation[]>(initialAnnotations)
    const [history, setHistory] = useState<VisionAnnotation[][]>([initialAnnotations])
    const [historyIndex, setHistoryIndex] = useState(0)
    const [currentAnnotation, setCurrentAnnotation] = useState<Partial<VisionAnnotation> | null>(null)
    const [activeTool, setActiveTool] = useState<AnnotationTool>('pen')
    const [activeColor, setActiveColor] = useState<AnnotationColor>('red')

    const canUndo = historyIndex > 0
    const canRedo = historyIndex < history.length - 1

    const pushToHistory = useCallback((newAnnotations: VisionAnnotation[]) => {
        // Remove any future states if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newAnnotations)

        // Limit history to 50 states
        if (newHistory.length > 50) {
            newHistory.shift()
        }

        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        setAnnotationsState(newAnnotations)
    }, [history, historyIndex])

    const startAnnotation = useCallback((point: { x: number; y: number }) => {
        const id = `annotation-${Date.now()}`

        if (activeTool === 'pen') {
            setCurrentAnnotation({
                id,
                tool: activeTool,
                color: activeColor,
                points: [point]
            })
        } else if (activeTool === 'text') {
            setCurrentAnnotation({
                id,
                tool: activeTool,
                color: activeColor,
                start: point,
                text: ''
            })
        } else {
            // circle, arrow
            setCurrentAnnotation({
                id,
                tool: activeTool,
                color: activeColor,
                start: point,
                end: point
            })
        }
    }, [activeTool, activeColor])

    const updateAnnotation = useCallback((point: { x: number; y: number }) => {
        if (!currentAnnotation) return

        if (currentAnnotation.tool === 'pen' && currentAnnotation.points) {
            setCurrentAnnotation({
                ...currentAnnotation,
                points: [...currentAnnotation.points, point]
            })
        } else if (currentAnnotation.tool !== 'text') {
            setCurrentAnnotation({
                ...currentAnnotation,
                end: point
            })
        }
    }, [currentAnnotation])

    const finishAnnotation = useCallback((text?: string) => {
        if (!currentAnnotation || !currentAnnotation.id || !currentAnnotation.tool || !currentAnnotation.color) return

        // Validate annotation has enough data
        if (currentAnnotation.tool === 'pen' && (!currentAnnotation.points || currentAnnotation.points.length < 2)) {
            setCurrentAnnotation(null)
            return
        }

        if (currentAnnotation.tool === 'text') {
            if (!text || text.trim() === '') {
                setCurrentAnnotation(null)
                return
            }
        }

        const newAnnotation: VisionAnnotation = {
            id: currentAnnotation.id,
            tool: currentAnnotation.tool,
            color: currentAnnotation.color,
            ...(currentAnnotation.points && { points: currentAnnotation.points }),
            ...(currentAnnotation.start && { start: currentAnnotation.start }),
            ...(currentAnnotation.end && { end: currentAnnotation.end }),
            ...(text && { text })
        }

        pushToHistory([...annotations, newAnnotation])
        setCurrentAnnotation(null)
    }, [currentAnnotation, annotations, pushToHistory])

    const cancelAnnotation = useCallback(() => {
        setCurrentAnnotation(null)
    }, [])

    const undo = useCallback(() => {
        if (canUndo) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            setAnnotationsState(history[newIndex])
        }
    }, [canUndo, historyIndex, history])

    const redo = useCallback(() => {
        if (canRedo) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            setAnnotationsState(history[newIndex])
        }
    }, [canRedo, historyIndex, history])

    const clear = useCallback(() => {
        pushToHistory([])
    }, [pushToHistory])

    const setAnnotations = useCallback((newAnnotations: VisionAnnotation[]) => {
        pushToHistory(newAnnotations)
    }, [pushToHistory])

    return {
        annotations,
        currentAnnotation,
        activeTool,
        activeColor,
        canUndo,
        canRedo,
        setActiveTool,
        setActiveColor,
        startAnnotation,
        updateAnnotation,
        finishAnnotation,
        cancelAnnotation,
        undo,
        redo,
        clear,
        setAnnotations
    }
}
