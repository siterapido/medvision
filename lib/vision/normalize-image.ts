import sharp from 'sharp'

const MAX_EDGE = 1600 // Reduzido de 2048 para imagens menores
const TARGET_SIZE_BYTES = 1.5 * 1024 * 1024 // 1.5MB target - mais conservador
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB hard limit

/**
 * Compressão agressiva para imagens médicas mantendo qualidade diagnóstica.
 * Usa WebP para melhor compressão sem perda perceptível de qualidade.
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

        // Stage 1: Resize se necessário (mais agressivo)
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

        // Stage 2: Tentar WebP primeiro (melhor compressão)
        // WebP com qualidade 85 é equivalente a JPEG 95 em qualidade visual
        const webpOut = await pipeline.webp({ quality: 85 }).toBuffer()

        if (webpOut.length <= TARGET_SIZE_BYTES) {
            return `data:image/webp;base64,${webpOut.toString('base64')}`
        }

        // Stage 3: Se ainda grande, reducir mais e tentar novamente
        if (webpOut.length <= MAX_SIZE_BYTES) {
            const currentWidth = w >= h ? MAX_EDGE : MAX_EDGE
            const newWidth = Math.floor(currentWidth * 0.75)
            pipeline = sharp(buf)
                .rotate()
                .resize({
                    width: newWidth,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
            const out = await pipeline.webp({ quality: 80 }).toBuffer()
            return `data:image/webp;base64,${out.toString('base64')}`
        }

        // Stage 4: Último recurso - JPEG com qualidade reduzida
        const jpegOut = await sharp(buf)
            .rotate()
            .resize({
                width: w >= h ? 1200 : undefined,
                height: h > w ? 1200 : undefined,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: 75, mozjpeg: true })
            .toBuffer()

        return `data:image/jpeg;base64,${jpegOut.toString('base64')}`
    } catch {
        return dataUrl
    }
}

/**
 * Compressão máxima possível mantendo alguma qualidade.
 * Útil para imagens muito grandes que estão dando timeout.
 */
export async function compressToMax(dataUrl: string, maxBytes = 500 * 1024): Promise<string> {
    if (!dataUrl.startsWith('data:image/')) {
        return dataUrl
    }

    const comma = dataUrl.indexOf(',')
    if (comma === -1) return dataUrl

    const b64 = dataUrl.slice(comma + 1)
    let buf: Buffer
    try {
        buf = Buffer.from(b64, 'base64')
    } catch {
        return dataUrl
    }

    if (buf.length < 32) return dataUrl

    try {
        const im = await sharp(buf).rotate().metadata()
        const w = im.width ?? 1200
        const h = im.height ?? 1200

        // Reduzir drasticamente e usar WebP
        const pipeline = sharp(buf)
            .rotate()
            .resize({
                width: 1024,
                height: 1024,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 70 })

        const out = await pipeline.toBuffer()

        // Se ainda muito grande, reducir mais
        if (out.length > maxBytes) {
            const smaller = await sharp(buf)
                .rotate()
                .resize({
                    width: 800,
                    height: 800,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .webp({ quality: 60 })
                .toBuffer()
            return `data:image/webp;base64,${smaller.toString('base64')}`
        }

        return `data:image/webp;base64,${out.toString('base64')}`
    } catch {
        return dataUrl
    }
}

/**
 * Validação rápida do tamanho.
 */
export function estimateCompressedSize(imageData: string): { ok: boolean; estimatedMb: number } {
    const comma = imageData.indexOf(',')
    if (comma === -1) {
        return { ok: true, estimatedMb: 0 }
    }
    const b64 = imageData.slice(comma + 1)
    const estimatedMb = (b64.length * 0.75) / (1024 * 1024)

    return {
        ok: estimatedMb < 10,
        estimatedMb: Math.round(estimatedMb * 100) / 100,
    }
}