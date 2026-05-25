/**
 * Estados do assistente Med Vision (fluxo em 2 etapas).
 */
export type VisionState =
    | 'UPLOAD'
    | 'CONFIGURE'
    | 'REVIEW'
    | 'ANALYZING'
    | 'RESULT'
    | 'ERROR'

export const WIZARD_STEPS = [
    { key: 'CONFIGURE', label: 'Personalizar' },
    { key: 'REVIEW', label: 'Revisar e analisar' },
] as const

export type VisionWizardStepKey = (typeof WIZARD_STEPS)[number]['key']

/** Passo do indicador linear associado ao estado atual. */
export function mapVisionStateToWizardStep(state: VisionState): VisionWizardStepKey {
    switch (state) {
        case 'REVIEW':
        case 'ANALYZING':
        case 'RESULT':
        case 'ERROR':
            return 'REVIEW'
        default:
            return 'CONFIGURE'
    }
}

/** Subtítulo opcional para sub-fases (análise). */
export function getVisionPhaseSubtitle(state: VisionState): string | undefined {
    switch (state) {
        case 'ANALYZING':
            return 'A análise pode levar até cerca de 2 minutos. Não feche esta página.'
        default:
            return undefined
    }
}

export function isWizardComplete(state: VisionState): boolean {
    return state === 'RESULT'
}
