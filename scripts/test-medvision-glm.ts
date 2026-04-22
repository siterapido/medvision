import { readFile } from 'node:fs/promises'

import dotenv from 'dotenv'

process.env.MEDVISION_VISION_LOG = '1'
process.env.MEDVISION_MODEL_TIMEOUT_MS = process.env.MEDVISION_MODEL_TIMEOUT_MS ?? '90000'

// Importante: carregar `.env.local` ANTES de importar módulos que "capturam" env var no init.
dotenv.config({ path: '.env.local', override: false })
dotenv.config({ path: '.env', override: false })

async function toPngDataUrl(path: string): Promise<string> {
    const buf = await readFile(path)
    return `data:image/png;base64,${buf.toString('base64')}`
}

async function main() {
    const { MODELS, hasMedVisionOpenRouterKey } = await import('@/lib/ai/openrouter')
    const { callVisionDetection } = await import('@/lib/vision/pipeline')

    if (!hasMedVisionOpenRouterKey()) {
        throw new Error(
            'OpenRouter API key ausente. Defina MEDVISION_OPENROUTER_API_KEY (ou OPENROUTER_API_KEY) em .env.local ou no ambiente.',
        )
    }

    const images = [
        'Imagens de teste/torax.png',
        'Imagens de teste/torax-1.png',
        'Imagens de teste/torax-3.png',
    ] as const

    const modelId = MODELS.vision // z-ai/glm-5v-turbo
    console.log('[medvision-glm] modelo:', modelId)

    for (const imgPath of images) {
        const t0 = performance.now()
        const imageData = await toPngDataUrl(imgPath)
        const result = await callVisionDetection(imageData, 'Teste automático (GLM).', [modelId])
        const ms = Math.round(performance.now() - t0)
        console.log('[medvision-glm] ok:', { imgPath, ms, detections: result.quickDetections.length, quality: result.meta.quality })
    }
}

main().catch((err) => {
    console.error('[medvision-glm] falhou:', err instanceof Error ? err.message : String(err))
    process.exitCode = 1
})

