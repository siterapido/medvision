import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { QuickDetectionSchema } from '../lib/vision/schemas'

describe('QuickDetectionSchema (box4)', () => {
    it('aceita box válido 0–100 com ymin < ymax e xmin < xmax', () => {
        const parsed = QuickDetectionSchema.parse({
            meta: {
                imageType: 'Tórax PA/AP',
                quality: 'Boa',
                qualityScore: 80,
            },
            quickDetections: [
                {
                    label: 'Opacidade',
                    box: [10, 20, 30, 40],
                    severity: 'moderate',
                    confidence: 0.9,
                },
            ],
        })
        assert.equal(parsed.quickDetections.length, 1)
    })

    it('rejeita box com ymin >= ymax', () => {
        assert.throws(() =>
            QuickDetectionSchema.parse({
                meta: {
                    imageType: 'Desconhecido',
                    quality: 'Aceitável',
                    qualityScore: 50,
                },
                quickDetections: [
                    {
                        label: 'Teste',
                        box: [50, 10, 40, 20],
                        severity: 'normal',
                        confidence: 0.5,
                    },
                ],
            }),
        )
    })
})
