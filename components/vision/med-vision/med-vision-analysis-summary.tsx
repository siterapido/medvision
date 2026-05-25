'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { VISION_MODALITIES, VISION_REPORT_DEPTHS } from '@/lib/constants/vision-analysis-options'
import { VISION_SPECIALTIES } from '@/lib/constants/vision-specialties'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import { MedVisionAiBadge } from '@/components/vision/med-vision/med-vision-ai-badge'

function formatPayloadSizeKb(dataUrl: string): string | null {
    const comma = dataUrl.indexOf(',')
    if (comma === -1) return null
    const b64 = dataUrl.slice(comma + 1)
    const kb = Math.round((b64.length * 0.75) / 1024)
    return `~${kb} KB`
}

type MedVisionAnalysisSummaryProps = {
    config: MedVisionAnalysisConfig
    imageDataUrl?: string | null
}

export function MedVisionAnalysisSummary({ config, imageDataUrl }: MedVisionAnalysisSummaryProps) {
    const modalityLabel =
        VISION_MODALITIES.find((m) => m.id === config.modality)?.label ?? config.modality
    const depthLabel =
        VISION_REPORT_DEPTHS.find((d) => d.id === config.reportDepth)?.label ?? config.reportDepth
    const specialtyLabel = VISION_SPECIALTIES[config.specialty]?.label ?? config.specialty
    const sizeLabel = imageDataUrl ? formatPayloadSizeKb(imageDataUrl) : null

    const sectionsOn = (
        [
            config.reportSections.findings && 'Achados',
            config.reportSections.impression && 'Impressão',
            config.reportSections.recommendations && 'Recomendações',
            config.reportSections.comparison && 'Comparativo',
        ] as (string | false)[]
    ).filter(Boolean) as string[]

    return (
        <GlassCard className="p-5 border-border/40 space-y-3">
            <h4 className="text-sm font-semibold">Resumo da análise</h4>
            <MedVisionAiBadge />

            <SummaryRow label="Especialidade" value={specialtyLabel} />
            <SummaryRow label="Modalidade" value={modalityLabel} />
            <SummaryRow label="Profundidade" value={depthLabel} />
            {config.focusTags.length > 0 && (
                <SummaryRow label="Foco" value={config.focusTags.join(', ')} />
            )}
            <SummaryRow
                label="Contexto clínico"
                value={config.clinicalContext.trim() || 'Não informado'}
            />
            {(config.patientAge != null || (config.patientSex && config.patientSex !== 'nao_informado')) && (
                <SummaryRow
                    label="Paciente (contexto)"
                    value={[
                        config.patientAge != null ? `${config.patientAge} anos` : null,
                        config.patientSex && config.patientSex !== 'nao_informado'
                            ? config.patientSex
                            : null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                />
            )}
            <SummaryRow
                label="Seções"
                value={sectionsOn.length ? sectionsOn.join(', ') : 'Nenhuma'}
            />
            {sizeLabel && <SummaryRow label="Imagem enviada" value={sizeLabel} />}
        </GlassCard>
    )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{label}</p>
            <p className="text-sm leading-snug">{value}</p>
        </div>
    )
}
