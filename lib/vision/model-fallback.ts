import { ZodError } from 'zod'

import { elapseMs, visionInfo } from '@/lib/vision/vision-log'

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
 * Calcula delay de backoff exponencial com jitter.
 * Fórmula: min(baseDelay * 2^attempt + random_jitter, maxDelay)
 */
function backoffDelay(attempt: number): number {
    const baseDelay = 2000 // 2 segundos
    const maxDelay = 30000 // 30 segundos
    const exponential = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 1000
    return Math.min(exponential + jitter, maxDelay)
}

/**
 * Chama modelos em sequência como fallback com backoff exponencial.
 * Se o primeiro modelo falhar com erro retryable, tenta o próximo.
 * Entre tentativas do mesmo modelo: backoff exponencial.
 */
export async function callWithFallback<T>(
    modelIds: readonly string[],
    generateFn: (modelId: string, signal: AbortSignal) => Promise<T>,
    options?: { estimatedPayloadBytes?: number; maxRetriesPerModel?: number },
): Promise<T> {
    let lastError: unknown
    const maxRetriesPerModel = options?.maxRetriesPerModel ?? 2
    const modelList = [...modelIds]

    for (let chainIndex = 0; chainIndex < modelList.length; chainIndex++) {
        const modelId = modelList[chainIndex]!
        const chainPosition = chainIndex + 1

        // Retry com backoff para o mesmo modelo
        for (let retry = 0; retry < maxRetriesPerModel; retry++) {
            const attemptNumber = chainPosition * maxRetriesPerModel + retry - maxRetriesPerModel + 1

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
                const retryLabel = retry > 0 ? `retry${retry}` : 'attempt'
                visionInfo('model.attempt', {
                    modelId,
                    attempt: attemptNumber,
                    maxAttempts: modelList.length * maxRetriesPerModel,
                    chainIndex,
                    retryWithinModel: retry,
                    maxRetriesPerModel,
                    timeoutMs,
                })
                const result = await generateFn(modelId, controller.signal)
                clearTimeout(timeoutId)
                visionInfo('model.success', {
                    modelId,
                    attempt: attemptNumber,
                    ms: elapseMs(started),
                    retriesWithinModel: retry,
                })
                return result
            } catch (error) {
                clearTimeout(timeoutId)
                lastError = error
                const ms = elapseMs(started)

                if (error instanceof ZodError || (error instanceof Error && (error.name === 'ZodError' || error.name === 'SyntaxError'))) {
                    visionInfo('model.parse_error', {
                        modelId,
                        attempt: attemptNumber,
                        ms,
                        errorKind: error instanceof Error ? error.name : 'ZodError',
                        retryWithinModel: retry,
                    })
                    // Erro de parse não é retryable para o mesmo modelo, mas tenta próximo
                    break // Sai do loop de retry, vai para próximo modelo
                } else if (isRetryableError(error)) {
                    const willRetrySameModel = retry < maxRetriesPerModel - 1
                    const willRetryNextModel = !willRetrySameModel && chainIndex < modelList.length - 1
                    const willRetry = willRetrySameModel || willRetryNextModel

                    visionInfo('model.failed_retryable', {
                        modelId,
                        attempt: attemptNumber,
                        ms,
                        chainIndex,
                        retryWithinModel: retry,
                        willRetry,
                        willRetrySameModel,
                        willRetryNextModel,
                        backoffMs: willRetrySameModel ? backoffDelay(retry) : 0,
                        message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
                    })

                    if (willRetrySameModel) {
                        // Backoff exponencial antes de retry no mesmo modelo
                        const delay = backoffDelay(retry)
                        await new Promise((resolve) => setTimeout(resolve, delay))
                        continue
                    }
                    if (willRetryNextModel) {
                        break // Sai do loop de retry, vai para próximo modelo
                    }
                    // Sem mais opções, throw
                    break
                } else {
                    visionInfo('model.failed_non_retryable', {
                        modelId,
                        attempt: attemptNumber,
                        ms,
                        retryWithinModel: retry,
                        message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
                    })
                    // Erro não retryable, não tenta próximo modelo
                    throw error
                }
            }
        }
    }

    throw lastError
}
