import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getSpecialtyConfig,
  VISION_SPECIALTIES,
  VISION_SPECIALTY_ORDER,
  type VisionSpecialty,
} from '../lib/constants/vision-specialties'

const ALL_SPECIALTIES: VisionSpecialty[] = [
  'torax',
  'cranio',
  'abdome',
  'coluna',
  'membro_superior',
  'membro_inferior',
  'pelve',
  'geral',
]

describe('vision specialties', () => {
  it('registro contém todas as especialidades com prompts não vazios', () => {
    for (const id of ALL_SPECIALTIES) {
      const config = VISION_SPECIALTIES[id]
      assert.equal(config.id, id)
      assert.ok(config.label.length > 0)
      assert.ok(config.systemPrompt.length > 500)
      assert.ok(config.quickDetectionPrompt.length > 100)
    }
  })

  it('ordem do seletor lista cada especialidade uma vez', () => {
    assert.equal(VISION_SPECIALTY_ORDER.length, ALL_SPECIALTIES.length)
    assert.equal(new Set(VISION_SPECIALTY_ORDER).size, ALL_SPECIALTIES.length)
    assert.deepEqual([...VISION_SPECIALTY_ORDER].sort(), [...ALL_SPECIALTIES].sort())
  })

  it('ordem do seletor coloca geral por último', () => {
    assert.equal(VISION_SPECIALTY_ORDER.at(-1), 'geral')
  })

  it('fallback para geral quando especialidade inválida ou ausente', () => {
    assert.equal(getSpecialtyConfig('invalid').id, 'geral')
    assert.equal(getSpecialtyConfig().id, 'geral')
  })

  it('especialidades regionais não reutilizam prompt idêntico ao geral', () => {
    const geralSystem = VISION_SPECIALTIES.geral.systemPrompt
    const regional: VisionSpecialty[] = [
      'abdome',
      'coluna',
      'membro_superior',
      'membro_inferior',
      'pelve',
    ]
    for (const id of regional) {
      assert.notEqual(VISION_SPECIALTIES[id].systemPrompt, geralSystem)
    }
  })
})
