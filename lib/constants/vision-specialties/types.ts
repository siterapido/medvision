export type VisionSpecialty =
  | 'torax'
  | 'cranio'
  | 'abdome'
  | 'coluna'
  | 'membro_superior'
  | 'membro_inferior'
  | 'pelve'
  | 'geral'

export interface SpecialtyPrompts {
  systemPrompt: string
  quickDetectionPrompt: string
  detailedAnalysisPrompt: string
  quickDetectionUserInstruction: string
  fullAnalysisUserInstruction: string
}

export interface SpecialtyConfig extends SpecialtyPrompts {
  id: VisionSpecialty
  label: string
  description: string
}
