import { ZodError } from 'zod'

import { elapseMs, visionInfo } from '@/lib/vision/vision-log'

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calcula timeout dinâmico baseado no tamanho estimado da imagem.
 * Adiciona ~15s por MB para processamentos mais longos.
 */
export function calculateDynamicTimeout(imageDataSizeBytes: number): number {
    const DEFAULT_TIMEOUT_MS = 90000
    const MIN_TIMEOUT_MS = 60000
    const MAX_TIMEOUT_MS = 300000

    const estimatedMB = imageDataSizeBytes / (1024 * 1024)
    const additionalMs = Math.min(estimatedMB * 20000, 60000)

    return Math.min(Math.max(DEFAULT_TIMEOUT_MS + additionalMs, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS)
}

function isRetryableError(error: unknown): boolean {
    if (error instanceof Error && error.name === 'AbortError') return true

    const statusCode =
        error && typeof error === 'object' && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : null

    if (statusCode === 429) return true
    if (statusCode && statusCode >= 500 && statusCode <= 599) return true

    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    return (
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('econnreset') ||
        msg.includes('enotfound') ||
        msg.includes('eai_again') ||
        msg.includes('rate limit') ||
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('502') ||
        msg.includes('500')
    )
}

/**
 * Chama apenas o primeiro modelo da lista, sem fallback.
 * Se falhar, lança erro diretamente (sem tentar outros modelos).
 */
export async function callWithFallback<T>(
    modelIds: readonly string[],
    generateFn: (modelId: string, signal: AbortSignal) => Promise<T>,
    options?: { estimatedPayloadBytes?: number },
): Promise<T> {
    const modelId = modelIds[0]!
    let lastError: unknown

    let timeoutMs: number
    if (options?.estimatedPayloadBytes) {
        timeoutMs = calculateDynamicTimeout(options.estimatedPayloadBytes)
    } else {
        const envTimeout = Number(process.env.MEDVISION_MODEL_TIMEOUT_MS)
        timeoutMs = Number.isFinite(envTimeout) && envTimeout >= 10_000 && envTimeout <= 300_000 ? envTimeout : 90_000
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    const started = performance.now()

    try {
        visionInfo('model.attempt', { modelId, attempt: 1, maxAttempts: 1, chainIndex: 0, timeoutMs })
        const result = await generateFn(modelId, controller.signal)
        clearTimeout(timeoutId)
        visionInfo('model.success', { modelId, attempt: 1, ms: elapseMs(started) })
        return result
    } catch (error) {
        clearTimeout(timeoutId)
        lastError = error
        const ms = elapseMs(started)

        if (error instanceof ZodError || (error instanceof Error && (error.name === 'ZodError' || error.name === 'SyntaxError'))) {
            visionInfo('model.parse_error', { modelId, attempt: 1, ms, errorKind: error instanceof Error ? error.name : 'ZodError' })
        } else if (isRetryableError(error)) {
            visionInfo('model.failed_retryable', { modelId, attempt: 1, ms, message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) })
        } else {
            visionInfo('model.failed_non_retryable', { modelId, attempt: 1, ms, message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) })
        }
    }

    throw lastError
}
