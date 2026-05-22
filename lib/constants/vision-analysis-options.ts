import type { VisionSpecialty } from '@/lib/constants/vision-specialties/types'

export const VISION_MODALITY_IDS = ['rx', 'tc', 'rm', 'us', 'outro'] as const

export type VisionModality = (typeof VISION_MODALITY_IDS)[number]

export const VISION_MODALITIES = [
  { id: 'rx' as VisionModality, label: 'Radiografia (RX)' },
  { id: 'tc' as VisionModality, label: 'Tomografia (TC)' },
  { id: 'rm' as VisionModality, label: 'Ressonância (RM)' },
  { id: 'us' as VisionModality, label: 'Ultrassom (US)' },
  { id: 'outro' as VisionModality, label: 'Outro' },
] as const

export const VISION_REPORT_DEPTH_IDS = ['resumido', 'completo'] as const

export type VisionReportDepth = (typeof VISION_REPORT_DEPTH_IDS)[number]

export const VISION_REPORT_DEPTHS = [
  {
    id: 'resumido' as VisionReportDepth,
    label: 'Resumido',
    description: 'Laudo objetivo, foco nos achados principais.',
  },
  {
    id: 'completo' as VisionReportDepth,
    label: 'Completo',
    description: 'Laudo detalhado com diferenciais e recomendações amplas.',
  },
] as const

export type VisionReportSections = {
  findings: boolean
  impression: boolean
  recommendations: boolean
  comparison: boolean
}

export const DEFAULT_REPORT_SECTIONS: VisionReportSections = {
  findings: true,
  impression: true,
  recommendations: true,
  comparison: false,
}

export const VISION_PATIENT_SEX_VALUES = [
  'masculino',
  'feminino',
  'outro',
  'nao_informado',
] as const

export type VisionPatientSex = (typeof VISION_PATIENT_SEX_VALUES)[number]

export const VISION_FOCUS_CHIPS_BY_SPECIALTY: Record<VisionSpecialty, string[]> = {
  torax: ['Suspeita de pneumonia', 'Derrame pleural', 'Pneumotórax', 'Nódulo pulmonar'],
  abdome: ['Dor abdominal', 'Obstrução intestinal', 'Colelitíase'],
  cranio: ['Trauma craniano', 'Sinusite', 'Fratura facial'],
  coluna: ['Hérnia discal', 'Estenose', 'Fratura vertebral'],
  pelve: ['Fratura de quadril', 'Artrose'],
  membro_superior: ['Fratura', 'Luxação'],
  membro_inferior: ['Fratura de tíbia/fíbula', 'Artrose de joelho'],
  geral: ['Achado incidental', 'Controle pós-operatório'],
}

export function getFocusChipsForSpecialty(specialty: VisionSpecialty): string[] {
  return (
    VISION_FOCUS_CHIPS_BY_SPECIALTY[specialty] ??
    VISION_FOCUS_CHIPS_BY_SPECIALTY.geral ??
    []
  )
}
