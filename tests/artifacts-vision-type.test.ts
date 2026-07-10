/**
 * Unit tests: artifact type validation includes vision (laudo persistence).
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ARTIFACT_VALID_TYPES,
  isValidArtifactType,
} from '../lib/constants/artifact-types'

describe('ARTIFACT_VALID_TYPES', () => {
  it('includes vision for Med Vision laudos', () => {
    assert.ok(ARTIFACT_VALID_TYPES.includes('vision'))
  })

  it('accepts vision via isValidArtifactType', () => {
    assert.equal(isValidArtifactType('vision'), true)
  })

  it('rejects unknown types', () => {
    assert.equal(isValidArtifactType('invalid_type'), false)
  })
})
