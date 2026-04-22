import { AlertCircle } from 'lucide-react'
import { VISION_CLINICAL_DISCLAIMER_PLAIN } from '@/lib/constants/vision'
import { cn } from '@/lib/utils'

type VisionClinicalDisclaimerProps = {
    className?: string
    variant?: 'default' | 'compact'
}

/** Aviso jurídico/clínico — apoio à decisão, não substitui avaliação profissional. */
export function VisionClinicalDisclaimer({ className, variant = 'default' }: VisionClinicalDisclaimerProps) {
    return (
        <div
            role="note"
            className={cn(
                'rounded-xl border border-border/50 bg-muted/20 text-muted-foreground',
                variant === 'compact' ? 'px-3 py-2 text-[10px] leading-snug' : 'px-4 py-3 text-xs leading-relaxed',
                className
            )}
        >
            <p className={cn('flex gap-2', variant === 'compact' ? 'items-start' : 'items-start')}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/80" aria-hidden />
                <span className="text-foreground/90">{VISION_CLINICAL_DISCLAIMER_PLAIN}</span>
            </p>
        </div>
    )
}
