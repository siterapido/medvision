'use client'

import { useState } from 'react'
import { FileText, Microscope, ChevronDown } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                        Avisos sobre a imagem (você pode continuar)
                    </p>
                    <ul className="space-y-0.5">
                        {qualityWarnings.map((w, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground">
                                • {w.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <GlassCard className="p-4 border-border/40 space-y-3">
                <Label className="text-sm font-semibold">Modalidade do exame</Label>
                <select
                    value={config.modality}
                    onChange={(e) =>
                        onChange({ modality: e.target.value as MedVisionAnalysisConfig['modality'] })
                    }
                    className="w-full rounded-md bg-muted/50 px-3 py-2 border border-border/50 text-sm"
                >
                    {VISION_MODALITIES.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.label}
                        </option>
                    ))}
                </select>
            </GlassCard>

            <GlassCard className="p-5 border-border/40">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Microscope className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Especialidade</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
                                'flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all',
                                config.specialty === s.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40',
                            )}
                        >
                            <span className="text-xs font-semibold">{s.label}</span>
                            <span className="text-[10px] leading-tight opacity-80">{s.description}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>

            <GlassCard className="p-4 border-border/40 space-y-3">
                <Label className="text-sm font-semibold">Profundidade do laudo</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VISION_REPORT_DEPTHS.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onChange({ reportDepth: d.id })}
                            className={cn(
                                'rounded-xl border-2 p-3 text-left transition-all',
                                config.reportDepth === d.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border/40 bg-muted/20 hover:bg-muted/40',
                            )}
                        >
                            <span className="text-xs font-semibold block">{d.label}</span>
                            <span className="text-[10px] text-muted-foreground">{d.description}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>

            <GlassCard className="p-4 border-border/40 space-y-3">
                <Label className="text-sm font-semibold">Foco clínico</Label>
                <div className="flex flex-wrap gap-1.5">
                    {suggestedChips.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => toggleTag(chip)}
                            className={cn(
                                'text-[11px] px-2.5 py-1 rounded-full border transition-all',
                                config.focusTags.includes(chip)
                                    ? 'border-primary bg-primary/15 text-primary'
                                    : 'border-border/50 bg-muted/30 text-muted-foreground',
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
                        className="h-9 text-sm"
                        maxLength={80}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    />
                    <button
                        type="button"
                        onClick={addCustomTag}
                        className="text-xs px-3 rounded-lg border border-border/50 hover:bg-muted/40"
                    >
                        Adicionar
                    </button>
                </div>
            </GlassCard>

            <GlassCard className="p-5 border-border/40">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Contexto clínico</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Opcional — queixa, histórico ou suspeita.</p>
                    </div>
                </div>
                <Textarea
                    value={config.clinicalContext}
                    onChange={(e) => onChange({ clinicalContext: e.target.value })}
                    placeholder="Ex: Paciente com tosse persistente há 3 semanas, febre e dispneia."
                    className="resize-none text-sm h-28 bg-muted/20 border-border/40"
                    maxLength={500}
                />
                {config.clinicalContext.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-right mt-1">
                        {config.clinicalContext.length}/500
                    </p>
                )}
            </GlassCard>

            <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm font-medium hover:bg-muted/40">
                    Mais opções
                    <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                    <GlassCard className="p-4 border-border/40 space-y-3">
                        <Label className="text-sm font-semibold">Contexto do paciente (sem identificação)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Idade (anos)</Label>
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
                                    className="h-9 mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Sexo</Label>
                                <select
                                    value={config.patientSex ?? 'nao_informado'}
                                    onChange={(e) =>
                                        onChange({
                                            patientSex: e.target
                                                .value as MedVisionAnalysisConfig['patientSex'],
                                        })
                                    }
                                    className="w-full h-9 mt-1 rounded-md bg-muted/50 px-2 border border-border/50 text-sm"
                                >
                                    {VISION_PATIENT_SEX_VALUES.map((v) => (
                                        <option key={v} value={v}>
                                            {PATIENT_SEX_LABELS[v] ?? v}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4 border-border/40 space-y-3">
                        <Label className="text-sm font-semibold">Seções do laudo</Label>
                        {(
                            [
                                ['findings', 'Achados'],
                                ['impression', 'Impressão diagnóstica'],
                                ['recommendations', 'Recomendações'],
                                ['comparison', 'Comparativo com exame anterior'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm">{label}</span>
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
                    </GlassCard>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
