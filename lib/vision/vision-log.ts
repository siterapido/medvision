/**
 * Logs de análise de imagem (Med Vision).
 * Desative mensagens informativas com MEDVISION_VISION_LOG=0 (erros/avisos críticos continuam).
 */

const PREFIX = '[vision]'

export function visionInfoEnabled(): boolean {
    return process.env.MEDVISION_VISION_LOG !== '0'
}

export type VisionLogFields = Record<string, string | number | boolean | null | undefined>

function stamp(fields?: VisionLogFields) {
    return { t: new Date().toISOString(), ...fields }
}

export function visionInfo(msg: string, fields?: VisionLogFields) {
    if (!visionInfoEnabled()) return
    if (fields && Object.keys(fields).length > 0) {
        console.log(PREFIX, msg, stamp(fields))
    } else {
        console.log(PREFIX, msg, stamp())
    }
}

/** Avisos do pipeline (sempre emitidos, para operação e debugging). */
export function visionWarn(msg: string, fields?: VisionLogFields) {
    if (fields && Object.keys(fields).length > 0) {
        console.warn(PREFIX, msg, stamp(fields))
    } else {
        console.warn(PREFIX, msg, stamp())
    }
}

export function visionError(msg: string, err?: unknown, fields?: VisionLogFields) {
    const base = fields && Object.keys(fields).length > 0 ? stamp(fields) : stamp()
    if (err instanceof Error) {
        const includeStack = process.env.NODE_ENV === 'development' && process.env.MEDVISION_VISION_LOG_STACK === '1'
        console.error(PREFIX, msg, { ...base, name: err.name, message: err.message, ...(includeStack ? { stack: err.stack } : {}) })
    } else if (err !== undefined) {
        console.error(PREFIX, msg, { ...base, detail: String(err) })
    } else {
        console.error(PREFIX, msg, base)
    }
}

export function imagePayloadStats(imageData: string) {
    const chars = imageData.length
    const approxBytes = Math.round(chars * 0.75)
    const approxMb = Math.round((approxBytes / (1024 * 1024)) * 100) / 100
    return { payloadChars: chars, approxBytes, approxMb }
}

export function getStructuredVisionOutputFromEnv(): boolean {
    return process.env.MEDVISION_STRUCTURED_OUTPUT !== '0'
}

export function elapseMs(start: number): number {
    return Math.round(performance.now() - start)
}
