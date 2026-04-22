import sharp from 'sharp'

const MAX_EDGE = 2048
const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB target max
const QUALITY_LEVELS = [92, 88, 82, 75] // Progressive quality reduction

/**
 * Corrige orientação EXIF e limita dimensão máxima (mantém proporção) para melhor leitura pelos modelos.
 * Tenta compressão progressiva se ainda muito grande após redimensionamento.
 * Falhas retornam o data URL original.
 */
export async function normalizeVisionImageDataUrl(dataUrl: string): Promise<string> {
    if (process.env.MEDVISION_DISABLE_IMAGE_NORMALIZE === '1') {
        return dataUrl
    }
    if (!dataUrl.startsWith('data:image/')) {
        return dataUrl
    }
    const comma = dataUrl.indexOf(',')
    if (comma === -1) {
        return dataUrl
    }
    const metaPart = dataUrl.slice(0, comma)
    if (!metaPart.includes('base64')) {
        return dataUrl
    }
    const b64 = dataUrl.slice(comma + 1)
    let buf: Buffer
    try {
        buf = Buffer.from(b64, 'base64')
    } catch {
        return dataUrl
    }
    if (buf.length < 32) {
        return dataUrl
    }

    try {
        const base = sharp(buf).rotate()
        const im = await base.metadata()
        const w = im.width ?? 0
        const h = im.height ?? 0

        // Stage 1: Resize if needed
        let pipeline = w > MAX_EDGE || h > MAX_EDGE
            ? sharp(buf)
                  .rotate()
                  .resize({
                      width: w >= h ? MAX_EDGE : undefined,
                      height: h > w ? MAX_EDGE : undefined,
                      fit: 'inside',
                      withoutEnlargement: true,
                  })
            : base

        // Stage 2: Try decreasing quality until under MAX_SIZE_BYTES
        for (const quality of QUALITY_LEVELS) {
            const out = await pipeline.jpeg({ quality }).toBuffer()

            if (out.length <= MAX_SIZE_BYTES) {
                return `data:image/jpeg;base64,${out.toString('base64')}`
            }

            // If still too large and we have room to reduce, resize more
            if (quality > QUALITY_LEVELS[QUALITY_LEVELS.length - 1]) {
                const currentWidth = im.width ?? MAX_EDGE
                const newWidth = Math.floor(currentWidth * 0.8)
                pipeline = sharp(buf)
                    .rotate()
                    .resize({
                        width: newWidth,
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
            }
        }

        // Final fallback with lowest quality
        const out = await pipeline.jpeg({ quality: 70 }).toBuffer()
        return `data:image/jpeg;base64,${out.toString('base64')}`
    } catch {
        return dataUrl
    }
}

/**
 * Versão síncrona simplificada que apenas valida o tamanho.
 * Usada para validação rápida antes do upload.
 */
export function estimateCompressedSize(imageData: string): { ok: boolean; estimatedMb: number } {
    const comma = imageData.indexOf(',')
    if (comma === -1) {
        return { ok: true, estimatedMb: 0 }
    }
    const b64 = imageData.slice(comma + 1)
    const estimatedMb = (b64.length * 0.75) / (1024 * 1024)

    return {
        ok: estimatedMb < 10, // 10MB hard limit
        estimatedMb: Math.round(estimatedMb * 100) / 100,
    }
}