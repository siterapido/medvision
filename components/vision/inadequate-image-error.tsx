'use client'

import { AlertTriangle, ImageIcon, RefreshCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

interface InadequateImageErrorProps {
    reason: string
    details?: string
    hasImage: boolean
    onTryAgain: () => void
    onNewUpload: () => void
}

export function InadequateImageError({
    reason,
    details,
    hasImage,
    onTryAgain,
    onNewUpload,
}: InadequateImageErrorProps) {
    return (
        <GlassCard className="p-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                    <ImageIcon className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Imagem Não Adequada
                        </h3>
                        <p className="text-sm mt-1 text-foreground/80">{reason}</p>
                        {details && (
                            <p className="text-xs mt-1.5 text-muted-foreground">{details}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg gap-2"
                            onClick={hasImage ? onTryAgain : onNewUpload}
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            {hasImage ? 'Tentar novamente' : 'Enviar outra imagem'}
                        </Button>
                        {hasImage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 rounded-lg gap-2 text-muted-foreground"
                                onClick={onNewUpload}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Nova imagem
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}