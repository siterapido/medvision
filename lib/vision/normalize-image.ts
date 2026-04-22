import sharp from 'sharp'

const MAX_EDGE = 2048

/**
 * Corrige orientação EXIF e limita dimensão máxima (mantém proporção) para melhor leitura pelos modelos.
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

        const pipeline =
            w > MAX_EDGE || h > MAX_EDGE
                ? sharp(buf)
                      .rotate()
                      .resize({
                          width: w >= h ? MAX_EDGE : undefined,
                          height: h > w ? MAX_EDGE : undefined,
                          fit: 'inside',
                          withoutEnlargement: true,
                      })
                : base

        const out = await pipeline.jpeg({ quality: 88 }).toBuffer()
        return `data:image/jpeg;base64,${out.toString('base64')}`
    } catch {
        return dataUrl
    }
}
