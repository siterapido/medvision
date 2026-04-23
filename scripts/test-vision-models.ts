/**
 * Smoke test: chama callVisionDetection uma vez por modelo (Kimi k2.6 e Qwen3 VL).
 * Uso: npx tsx scripts/test-vision-models.ts [caminho/imagem.png]
 * Requer MEDVISION_OPENROUTER_API_KEY ou OPENROUTER_API_KEY.
 */
import { readFile } from 'node:fs/promises'

import dotenv from 'dotenv'

process.env.MEDVISION_VISION_LOG = '1'
process.env.MEDVISION_MODEL_TIMEOUT_MS = process.env.MEDVISION_MODEL_TIMEOUT_MS ?? '120000'

dotenv.config({ path: '.env.local', override: false })
dotenv.config({ path: '.env', override: false })

/** PNG 1×1 mínimo (fallback se não houver arquivo). */
const TINY_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

async function toPngDataUrl(path: string): Promise<string> {
    const buf = await readFile(path)
    return `data:image/png;base64,${buf.toString('base64')}`
}

async function main() {
    const { MODELS, hasMedVisionOpenRouterKey } = await import('@/lib/ai/openrouter')
    const { callVisionDetection } = await import('@/lib/vision/pipeline')

    if (!hasMedVisionOpenRouterKey()) {
        throw new Error(
            'OpenRouter API key ausente. Defina MEDVISION_OPENROUTER_API_KEY (ou OPENROUTER_API_KEY) em .env.local.',
        )
    }

    const fileArg = process.argv[2]
    let imageData: string
    if (fileArg) {
        imageData = await toPngDataUrl(fileArg)
        console.log('[vision-models] imagem:', fileArg)
    } else {
        imageData = TINY_PNG_DATA_URL
        console.log('[vision-models] usando PNG mínimo embutido (passe um .png como argumento para teste realista)')
    }

    const models = [MODELS.vision, MODELS.visionQwen] as const
    console.log('[vision-models] modelos:', [...models].join(' | '))

    for (const modelId of models) {
        const t0 = performance.now()
        try {
            const result = await callVisionDetection(
                imageData,
                'Teste automático de funcionamento do pipeline de visão.',
                [modelId],
            )
            const ms = Math.round(performance.now() - t0)
            console.log('[vision-models] ok:', {
                modelId,
                ms,
                detections: result.quickDetections.length,
                quality: result.meta?.quality,
            })
        } catch (err) {
            const ms = Math.round(performance.now() - t0)
            console.error('[vision-models] falhou:', {
                modelId,
                ms,
                error: err instanceof Error ? err.message : String(err),
            })
            process.exitCode = 1
        }
    }
}

main().catch((err) => {
    console.error('[vision-models] erro fatal:', err instanceof Error ? err.message : String(err))
    process.exitCode = 1
})
