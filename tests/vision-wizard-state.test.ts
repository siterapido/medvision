import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    WIZARD_STEPS,
    mapVisionStateToWizardStep,
} from '../components/vision/med-vision/vision-wizard-state'

describe('vision-wizard-state', () => {
    it('tem exatamente 2 passos', () => {
        assert.equal(WIZARD_STEPS.length, 2)
        assert.equal(WIZARD_STEPS[0]?.key, 'CONFIGURE')
        assert.equal(WIZARD_STEPS[1]?.key, 'REVIEW')
    })

    it('ANALYZING mapeia para REVIEW no indicador', () => {
        assert.equal(mapVisionStateToWizardStep('ANALYZING'), 'REVIEW')
    })

    it('CONFIGURE mapeia para CONFIGURE', () => {
        assert.equal(mapVisionStateToWizardStep('CONFIGURE'), 'CONFIGURE')
    })
})
