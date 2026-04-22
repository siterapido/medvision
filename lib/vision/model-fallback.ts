import { ZodError } from 'zod'

import { elapseMs, visionInfo } from '@/lib/vision/vision-log'

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
 * Tenta `generateFn` em cada modelo, com até 2 tentativas por modelo.
 * Erros de parse (Zod/Syntax) e falhas de API/provedor passam ao próximo modelo;
 * retries no mesmo modelo só para erros transitórios (rede, 5xx, rate limit, abort).
 */
export async function callWithFallback<T>(
    modelIds: readonly string[],
    generateFn: (modelId: string, signal: AbortSignal) => Promise<T>,
): Promise<T> {
    let lastError: unknown
    const timeoutMsRaw = Number(process.env.MEDVISION_MODEL_TIMEOUT_MS)
    const timeoutMs =
        Number.isFinite(timeoutMsRaw) && timeoutMsRaw >= 10_000 && timeoutMsRaw <= 180_000 ? timeoutMsRaw : 60_000

    for (let chainIndex = 0; chainIndex < modelIds.length; chainIndex++) {
        const modelId = modelIds[chainIndex]!
        for (let attempt = 1; attempt <= 2; attempt++) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
            const started = performance.now()

            try {
                visionInfo('model.attempt', { modelId, attempt, maxAttempts: 2, chainIndex, timeoutMs })
                const result = await generateFn(modelId, controller.signal)
                clearTimeout(timeoutId)
                visionInfo('model.success', { modelId, attempt, ms: elapseMs(started) })
                return result
            } catch (error) {
                clearTimeout(timeoutId)
                lastError = error
                const ms = elapseMs(started)

                if (
                    error instanceof ZodError ||
                    (error instanceof Error && (error.name === 'ZodError' || error.name === 'SyntaxError'))
                ) {
                    const name = error instanceof Error ? error.name : 'ZodError'
                    visionInfo('model.parse_error', {
                        modelId,
                        attempt,
                        ms,
                        errorKind: name,
                    })
                    break
                }

                const isRetryable =
                    isRetryableError(error)

                if (!isRetryable) {
                    visionInfo('model.failed_non_retryable', {
                        modelId,
                        attempt,
                        ms,
                        message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
                    })
                    break
                }

                if (attempt < 2) {
                    visionInfo('model.retry_scheduled', { modelId, attempt, ms, delayMs: 1000 })
                    await sleep(1_000)
                } else {
                    visionInfo('model.exhausted_retries', { modelId, attempt, ms })
                }
            }
        }
    }

    throw lastError
}
