import {
  VISION_MODALITIES,
  VISION_REPORT_DEPTHS,
} from '@/lib/constants/vision-analysis-options'
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'

import { sanitizeClinicalContext } from '@/lib/vision/json-utils'

/**
 * Monta o bloco textual de instruções e contexto clínico para o pipeline Vision,
 * combinando modalidade, profundidade do laudo, foco, dados demográficos,
 * diretrizes de seções e contexto sanitizado.
 */
export function buildVisionUserContext(
  config: Partial<MedVisionAnalysisConfig>,
): string | null {
  const parts: string[] = []

  if (config.modality) {
    const modalityLabel =
      VISION_MODALITIES.find((m) => m.id === config.modality)?.label ??
      config.modality
    parts.push(`MODALIDADE DO EXAME: ${modalityLabel.toUpperCase()}`)
  }

  if (config.reportDepth) {
    const depthLabel =
      VISION_REPORT_DEPTHS.find((d) => d.id === config.reportDepth)?.label ??
      config.reportDepth
    parts.push(
      `PROFUNDIDADE DO LAUDO: ${depthLabel} (${config.reportDepth})`,
    )
  }

  if (config.focusTags?.length) {
    parts.push(`FOCO CLÍNICO (tags): ${config.focusTags.join('; ')}`)
  }

  if (config.patientAge != null) {
    parts.push(
      `CONTEXTO DEMOGRÁFICO: ${config.patientAge} anos (sem identificação do paciente).`,
    )
  }

  if (
    config.patientSex &&
    config.patientSex !== 'nao_informado'
  ) {
    parts.push(`SEXO PARA CONTEXTO EPIDEMIOLÓGICO: ${config.patientSex}`)
  }

  const sections = config.reportSections
  if (sections) {
    if (!sections.findings) {
      parts.push('NÃO inclua seção detalhada de achados.')
    }
    if (!sections.impression) {
      parts.push('NÃO inclua impressão diagnóstica.')
    }
    if (!sections.recommendations) {
      parts.push('NÃO inclua seção de recomendações.')
    }
    if (!sections.comparison) {
      parts.push('NÃO inclua comparativo com exame anterior.')
    }
  }

  const ctx = config.clinicalContext?.trim()
  if (ctx) {
    parts.push(
      `CONTEXTO CLÍNICO DO PROFISSIONAL:\n${sanitizeClinicalContext(ctx)}`,
    )
  }

  return parts.length ? parts.join('\n\n') : null
}
