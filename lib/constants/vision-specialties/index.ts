import type { SpecialtyConfig, VisionSpecialty } from './types'
import { toraxConfig } from './torax'
import { cranioConfig } from './cranio'
import { geralConfig } from './geral'
import { abdomeConfig } from './abdome'
import { colunaConfig } from './coluna'
import { membroSuperiorConfig } from './membro-superior'
import { membroInferiorConfig } from './membro-inferior'
import { pelveConfig } from './pelve'

export type { VisionSpecialty, SpecialtyConfig, SpecialtyPrompts } from './types'

export const VISION_SPECIALTY_ORDER: VisionSpecialty[] = [
    'torax',
    'abdome',
    'pelve',
    'coluna',
    'cranio',
    'membro_superior',
    'membro_inferior',
    'geral',
]

export const VISION_SPECIALTIES: Record<VisionSpecialty, SpecialtyConfig> = {
    torax: toraxConfig,
    abdome: abdomeConfig,
    pelve: pelveConfig,
    coluna: colunaConfig,
    cranio: cranioConfig,
    membro_superior: membroSuperiorConfig,
    membro_inferior: membroInferiorConfig,
    geral: geralConfig,
}

export function getSpecialtyConfig(specialty?: string): SpecialtyConfig {
    if (specialty && specialty in VISION_SPECIALTIES) {
        return VISION_SPECIALTIES[specialty as VisionSpecialty]
    }
    return VISION_SPECIALTIES.geral
}
