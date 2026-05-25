'use client'

import { Sparkles } from 'lucide-react'
import { MEDVISION_AI_LABEL } from '@/lib/constants/vision'
import { cn } from '@/lib/utils'

type MedVisionAiBadgeProps = {
    className?: string
}

export function MedVisionAiBadge({ className }: MedVisionAiBadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary',
                className,
            )}
        >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{MEDVISION_AI_LABEL}</span>
        </div>
    )
}
