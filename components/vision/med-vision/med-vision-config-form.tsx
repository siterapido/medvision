'use client'

import { useState } from 'react'
import { FileText, Microscope, ChevronDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { VISION_SPECIALTIES, VISION_SPECIALTY_ORDER } from '@/lib/constants/vision-specialties'
import {
    VISION_MODALITIES,
    VISION_REPORT_DEPTHS,
    VISION_PATIENT_SEX_VALUES,
    getFocusChipsForSpecialty,
} from '@/lib/constants/vision-analysis-options'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import type { ImageQualityWarning } from '@/lib/utils/image-quality-validator'
import { MedVisionAiBadge } from '@/components/vision/med-vision/med-vision-ai-badge'

export type MedVisionConfigFormProps = {
    config: MedVisionAnalysisConfig
    onChange: (patch: Partial<MedVisionAnalysisConfig>) => void
    qualityWarnings?: ImageQualityWarning[]
}

const PATIENT_SEX_LABELS: Record<string, string> = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    outro: 'Outro',
    nao_informado: 'Não informado',
}

const PANEL = 'rounded-xl border border-rule bg-surface-raised'

export function MedVisionConfigForm({ config, onChange, qualityWarnings }: MedVisionConfigFormProps) {
    const [customTag, setCustomTag] = useState('')
    const suggestedChips = getFocusChipsForSpecialty(config.specialty)

    const toggleTag = (tag: string) => {
        const has = config.focusTags.includes(tag)
        onChange({
            focusTags: has
                ? config.focusTags.filter((t) => t !== tag)
                : [...config.focusTags, tag].slice(0, 12),
        })
    }

    const addCustomTag = () => {
        const t = customTag.trim()
        if (!t || config.focusTags.includes(t) || config.focusTags.length >= 12) return
        onChange({ focusTags: [...config.focusTags, t] })
        setCustomTag('')
    }

    return (
        <div className="space-y-4">
            <MedVisionAiBadge />

            {qualityWarnings && qualityWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-clinical-warn/10 border border-clinical-warn/25">
                    <p className="text-xs font-medium text-clinical-warn mb-1">
                        Avisos sobre a imagem (você pode continuar)
                    </p>
                    <ul className="space-y-0.5">
                        {qualityWarnings.map((w, i) => (
                            <li key={i} className="text-[11px] text-ink-muted">
                                • {w.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={cn(PANEL, 'p-4 space-y-3')}>
                <Label className="text-sm font-semibold text-ink">Modalidade do exame</Label>
                <Select
                    value={config.modality}
                    onValueChange={(value) =>
                        onChange({ modality: value as MedVisionAnalysisConfig['modality'] })
                    }
                >
                    <SelectTrigger className="w-full border-rule bg-surface">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {VISION_MODALITIES.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className={cn(PANEL, 'p-5')}>
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-1.5 rounded-lg border border-rule bg-surface shrink-0">
                        <Microscope className="w-4 h-4 text-signal" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-ink">Especialidade</h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                            Tipo de análise para um laudo mais preciso.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {VISION_SPECIALTY_ORDER.map((id) => VISION_SPECIALTIES[id]).map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onChange({ specialty: s.id })}
                            className={cn(
                                'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors',
                                config.specialty === s.id
                                    ? 'border-signal bg-signal/8 text-ink'
                                    : 'border-rule bg-surface text-ink-muted hover:border-signal/30 hover:bg-surface-raised',
                            )}
                        >
                            <span className="text-xs font-semibold">{s.label}</span>
                            <span className="text-[10px] leading-tight opacity-80">{s.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={cn(PANEL, 'p-4 space-y-3')}>
                <Label className="text-sm font-semibold text-ink">Profundidade do laudo</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VISION_REPORT_DEPTHS.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onChange({ reportDepth: d.id })}
                            className={cn(
                                'rounded-xl border p-3 text-left transition-colors',
                                config.reportDepth === d.id
                                    ? 'border-signal bg-signal/8'
                                    : 'border-rule bg-surface hover:bg-surface-raised',
                            )}
                        >
                            <span className="text-xs font-semibold block text-ink">{d.label}</span>
                            <span className="text-[10px] text-ink-muted">{d.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={cn(PANEL, 'p-4 space-y-3')}>
                <Label className="text-sm font-semibold text-ink">Foco clínico</Label>
                <div className="flex flex-wrap gap-1.5">
                    {suggestedChips.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => toggleTag(chip)}
                            className={cn(
                                'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                                config.focusTags.includes(chip)
                                    ? 'border-signal bg-signal/10 text-ink'
                                    : 'border-rule bg-surface text-ink-muted',
                            )}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Outro foco…"
                        className="h-9 text-sm border-rule bg-surface"
                        maxLength={80}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    />
                    <button
                        type="button"
                        onClick={addCustomTag}
                        className="text-xs px-3 rounded-lg border border-rule bg-surface hover:bg-surface-raised text-ink-muted"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            <div className={cn(PANEL, 'p-5')}>
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-1.5 rounded-lg border border-rule bg-surface shrink-0">
                        <FileText className="w-4 h-4 text-signal" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-ink">Contexto clínico</h4>
                        <p className="text-xs text-ink-muted mt-0.5">Opcional — queixa, histórico ou suspeita.</p>
                    </div>
                </div>
                <Textarea
                    value={config.clinicalContext}
                    onChange={(e) => onChange({ clinicalContext: e.target.value })}
                    placeholder="Ex: Paciente com tosse persistente há 3 semanas, febre e dispneia."
                    className="resize-none text-sm h-28 border-rule bg-surface"
                    maxLength={500}
                />
                {config.clinicalContext.length > 0 && (
                    <p className="text-[10px] text-ink-muted text-right mt-1">
                        {config.clinicalContext.length}/500
                    </p>
                )}
            </div>

            <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-rule bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-surface-raised">
                    Mais opções
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                    <div className={cn(PANEL, 'p-4 space-y-3')}>
                        <Label className="text-sm font-semibold text-ink">Contexto do paciente (sem identificação)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-ink-muted">Idade (anos)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={120}
                                    value={config.patientAge ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        onChange({
                                            patientAge: v === '' ? undefined : Number.parseInt(v, 10),
                                        })
                                    }}
                                    className="h-9 mt-1 border-rule bg-surface"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-ink-muted">Sexo</Label>
                                <Select
                                    value={config.patientSex ?? 'nao_informado'}
                                    onValueChange={(value) =>
                                        onChange({
                                            patientSex: value as MedVisionAnalysisConfig['patientSex'],
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full h-9 mt-1 border-rule bg-surface">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VISION_PATIENT_SEX_VALUES.map((v) => (
                                            <SelectItem key={v} value={v}>
                                                {PATIENT_SEX_LABELS[v] ?? v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className={cn(PANEL, 'p-4 space-y-3')}>
                        <Label className="text-sm font-semibold text-ink">Seções do laudo</Label>
                        {(
                            [
                                ['findings', 'Achados'],
                                ['impression', 'Impressão diagnóstica'],
                                ['recommendations', 'Recomendações'],
                                ['comparison', 'Comparativo com exame anterior'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm text-ink">{label}</span>
                                <Switch
                                    checked={config.reportSections[key]}
                                    onCheckedChange={(checked) =>
                                        onChange({
                                            reportSections: {
                                                ...config.reportSections,
                                                [key]: checked,
                                            },
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
