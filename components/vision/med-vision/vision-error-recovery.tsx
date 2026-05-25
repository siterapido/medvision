'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronRight, Crop, RefreshCcw } from 'lucide-react'

type VisionErrorRecoveryProps = {
    hasImage: boolean
    onRetry: () => void
    onBackToReview: () => void
    onNewUpload: () => void
}

/**
 * Ações após falha na análise, sem perder contexto (imagem e personalização permanecem no estado).
 */
export function VisionErrorRecovery({
    hasImage,
    onRetry,
    onBackToReview,
    onNewUpload,
}: VisionErrorRecoveryProps) {
    if (!hasImage) {
        return (
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
                <Button variant="outline" className="h-11 rounded-xl gap-2" onClick={onNewUpload}>
                    Enviar outra imagem
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3 w-full max-w-lg mx-auto">
            <p className="text-[11px] text-center text-muted-foreground">
                A imagem e as opções de personalização foram mantidas. Escolha como prefere continuar:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button className="h-11 rounded-xl gap-2" onClick={onRetry}>
                    <RefreshCcw className="w-4 h-4" />
                    Tentar novamente
                </Button>
                <Button variant="outline" className="h-11 rounded-xl gap-2" onClick={onBackToReview}>
                    <Crop className="w-4 h-4" />
                    Voltar à revisão
                </Button>
                <Button
                    variant="ghost"
                    className="h-11 rounded-xl gap-2 text-muted-foreground sm:col-span-2"
                    onClick={onNewUpload}
                >
                    Nova imagem
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

export function VisionErrorBanner() {
    return (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <div className="flex-1">
                <p className="text-sm font-medium">Não foi possível completar a análise.</p>
                <p className="text-xs mt-1 opacity-80">
                    Verifique sua conexão. Se o erro persistir, tente uma imagem menor ou contate o suporte.
                </p>
            </div>
        </div>
    )
}
