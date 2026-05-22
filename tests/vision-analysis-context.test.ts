import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildVisionUserContext } from '@/lib/vision/build-analysis-context'

describe('buildVisionUserContext', () => {
  it('monta blocos de modalidade, profundidade e seções desligadas', () => {
    const text = buildVisionUserContext({
      modality: 'tc',
      reportDepth: 'resumido',
      focusTags: ['Suspeita de pneumonia'],
      clinicalContext: 'Tosse há 3 semanas',
      patientAge: 45,
      patientSex: 'masculino',
      reportSections: {
        findings: true,
        impression: true,
        recommendations: false,
        comparison: false,
      },
    })
    assert.notEqual(text, null)
    assert.ok(text!.includes('MODALIDADE DO EXAME: TOMOGRAFIA (TC)'))
    assert.ok(text!.includes('PROFUNDIDADE DO LAUDO: Resumido (resumido)'))
    assert.ok(text!.includes('Suspeita de pneumonia'))
    assert.ok(text!.includes('NÃO inclua seção de recomendações'))
    assert.ok(text!.includes('45 anos'))
  })

  it('retorna null quando config vazio', () => {
    assert.equal(buildVisionUserContext({}), null)
  })
})
