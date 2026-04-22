import { ZodError } from 'zod'

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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

    for (const modelId of modelIds) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 45_000)

            try {
                console.log(`Trying model: ${modelId} (attempt ${attempt}/2)`)
                const result = await generateFn(modelId, controller.signal)
                clearTimeout(timeoutId)
                return result
            } catch (error) {
                clearTimeout(timeoutId)
                lastError = error

                if (
                    error instanceof ZodError ||
                    (error instanceof Error && (error.name === 'ZodError' || error.name === 'SyntaxError'))
                ) {
                    const name = error instanceof Error ? error.name : 'ZodError'
                    console.warn(`Model ${modelId} returned a parse error (${name}), skipping to next model`)
                    break
                }

                const isRetryable =
                    error instanceof Error &&
                    (error.message.includes('timeout') ||
                        error.message.includes('network') ||
                        error.message.includes('503') ||
                        error.message.includes('502') ||
                        error.message.includes('500') ||
                        error.message.includes('429') ||
                        error.message.includes('ECONNRESET') ||
                        error.message.includes('fetch failed') ||
                        error.message.includes('rate limit') ||
                        error.name === 'AbortError')

                if (!isRetryable) {
                    console.warn(`Model ${modelId} failed (non-retryable), trying next model:`, error)
                    break
                }

                if (attempt < 2) {
                    console.warn(`Model ${modelId} failed (attempt ${attempt}/2), retrying in 1000ms...`)
                    await sleep(1_000)
                } else {
                    console.warn(`Model ${modelId} exhausted retries, trying next model...`)
                }
            }
        }
    }

    throw lastError
}
