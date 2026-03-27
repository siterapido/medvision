/**
 * Shared severity constants for OdontoVision.
 * Single source of truth — used by image-overlay, detection-popover, and page.
 */

export type VisionSeverity = 'critical' | 'moderate' | 'normal'

export interface SeverityStyle {
    /** Tailwind border class */
    border: string
    /** Tailwind bg class (transparent fill) */
    bg: string
    /** Tailwind solid bg class (label pill background) */
    label: string
    /** Hex color for SVG/canvas */
    hex: string
    /** Tailwind text color class */
    text: string
    /** Combined badge classes: text + light bg + border (for Badge components) */
    badge: string
    /** Human-readable Portuguese label */
    ptLabel: string
}

export const SEVERITY_STYLES: Record<VisionSeverity, SeverityStyle> = {
    critical: {
        border: 'border-red-500',
        bg: 'bg-red-500/20',
        label: 'bg-red-500',
        hex: '#ef4444',
        text: 'text-red-500',
        badge: 'text-red-500 bg-red-500/10 border-red-500/30',
        ptLabel: 'Crítico',
    },
    moderate: {
        border: 'border-amber-500',
        bg: 'bg-amber-500/20',
        label: 'bg-amber-500',
        hex: '#f59e0b',
        text: 'text-amber-500',
        badge: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        ptLabel: 'Moderado',
    },
    normal: {
        border: 'border-blue-500',
        bg: 'bg-blue-500/20',
        label: 'bg-blue-500',
        hex: '#3b82f6',
        text: 'text-blue-500',
        badge: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
        ptLabel: 'Normal',
    },
}

export function getSeverityStyle(severity: string): SeverityStyle {
    return SEVERITY_STYLES[severity as VisionSeverity] ?? {
        border: 'border-gray-500',
        bg: 'bg-gray-500/20',
        label: 'bg-gray-500',
        hex: '#9ca3af',
        text: 'text-gray-500',
        badge: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
        ptLabel: 'Desconhecido',
    }
}
