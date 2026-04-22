/**
 * Estados do assistente Med Vision (upload → resultado).
 * Usado pelo indicador de passos e subtítulos de fase.
 */
export type VisionState =
    | 'UPLOAD'
    | 'DESCRIBE'
    | 'MODELS'
    | 'VALIDATING'
    | 'CROP'
    | 'CONFIRM'
    | 'ANALYZING'
    | 'RESULT'
    | 'ERROR'

export const WIZARD_STEPS: { key: Exclude<VisionState, 'VALIDATING' | 'ANALYZING' | 'RESULT' | 'ERROR'>; label: string }[] = [
    { key: 'UPLOAD', label: 'Imagem' },
    { key: 'DESCRIBE', label: 'Problema' },
    { key: 'MODELS', label: 'Modelos' },
    { key: 'CROP', label: 'Ajustes' },
    { key: 'CONFIRM', label: 'Confirmar' },
]

export type VisionWizardStepKey = (typeof WIZARD_STEPS)[number]['key']

/** Passo do indicador linear associado ao estado atual. */
export function mapVisionStateToWizardStep(state: VisionState): VisionWizardStepKey {
    switch (state) {
        case 'UPLOAD':
        case 'ERROR':
            return 'UPLOAD'
        case 'DESCRIBE':
            return 'DESCRIBE'
        case 'MODELS':
            return 'MODELS'
        case 'VALIDATING':
        case 'CROP':
            return 'CROP'
        case 'CONFIRM':
        case 'ANALYZING':
        case 'RESULT':
            return 'CONFIRM'
        default:
            return 'UPLOAD'
    }
}

/** Subtítulo opcional para sub-fases (análise, validação). */
export function getVisionPhaseSubtitle(state: VisionState): string | undefined {
    switch (state) {
        case 'ANALYZING':
            return 'A análise pode levar até cerca de 2 minutos. Não feche esta página.'
        case 'VALIDATING':
            return 'Verificando qualidade da imagem…'
        default:
            return undefined
    }
}

export function isWizardComplete(state: VisionState): boolean {
    return state === 'RESULT'
}
