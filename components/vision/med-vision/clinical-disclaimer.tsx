import { VISION_CLINICAL_DISCLAIMER_PLAIN } from '@/lib/constants/vision'
import { cn } from '@/lib/utils'

type VisionClinicalDisclaimerProps = {
    className?: string
    variant?: 'default' | 'compact'
}

/** Aviso jurídico/clínico — sempre visível, tipografia discreta. */
export function VisionClinicalDisclaimer({ className, variant = 'default' }: VisionClinicalDisclaimerProps) {
    return (
        <div
            role="note"
            className={cn(
                'rounded-lg border border-rule bg-surface text-ink-muted',
                variant === 'compact' ? 'px-3 py-2 text-[11px] leading-snug' : 'px-4 py-3 text-xs leading-relaxed',
                className,
            )}
        >
            <p>{VISION_CLINICAL_DISCLAIMER_PLAIN}</p>
        </div>
    )
}
