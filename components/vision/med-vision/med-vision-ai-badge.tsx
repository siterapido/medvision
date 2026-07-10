'use client'

import { MEDVISION_AI_LABEL } from '@/lib/constants/vision'
import { cn } from '@/lib/utils'

type MedVisionAiBadgeProps = {
    className?: string
}

/** Status discreto — apoio à análise, sem hero de IA. */
export function MedVisionAiBadge({ className }: MedVisionAiBadgeProps) {
    return (
        <p
            role="status"
            className={cn('text-[11px] font-medium text-ink-muted tracking-tight', className)}
        >
            {MEDVISION_AI_LABEL}
        </p>
    )
}
