import { APICallError } from 'ai'
import { ZodError } from 'zod'
import { ImageInadequateError } from '@/lib/vision/pipeline'

export type VisionErrorKind =
    | 'unauthorized'
    | 'rate_limited'
    | 'provider_unavailable'
    | 'timeout'
    | 'network'
    | 'parse_error'
    | 'bad_request'
    | 'inadequate_image'
    | 'unknown'

export type VisionErrorClassification = {
    kind: VisionErrorKind
    retryable: boolean
    httpStatus: number
    code: string
    safeMessage: string
    details?: string
}

function lowerMessage(err: unknown): string {
    if (!err) return ''
    if (err instanceof Error) return err.message.toLowerCase()
    return String(err).toLowerCase()
}

function statusFromUnknown(err: unknown): number | null {
    if (!err || typeof err !== 'object') return null
    const maybe = err as { statusCode?: unknown; status?: unknown; code?: unknown }
    if (typeof maybe.statusCode === 'number') return maybe.statusCode
    if (typeof maybe.status === 'number') return maybe.status
    return null
}

export function classifyVisionError(err: unknown): VisionErrorClassification {
    // parse errors (schema/json)
    if (err instanceof ZodError || (err instanceof Error && (err.name === 'ZodError' || err.name === 'SyntaxError'))) {
        return {
            kind: 'parse_error',
            retryable: true,
            httpStatus: 502,
            code: 'VISION_PARSE_ERROR',
            safeMessage: 'Falha ao interpretar a resposta do provedor de IA. Tentando outro modelo.',
        }
    }

    if (APICallError.isInstance(err)) {
        const status = err.statusCode ?? 500
        if (status === 401 || status === 403) {
            return {
                kind: 'unauthorized',
                retryable: false,
                httpStatus: 500,
                code: 'VISION_PROVIDER_AUTH',
                safeMessage: 'Falha de autenticação com o provedor de IA. Verifique a configuração de API key.',
            }
        }
        if (status === 402) {
            return {
                kind: 'bad_request',
                retryable: false,
                httpStatus: 502,
                code: 'VISION_PROVIDER_BILLING',
                safeMessage: 'Cota ou faturamento do provedor de IA indisponível.',
            }
        }
        if (status === 429) {
            return {
                kind: 'rate_limited',
                retryable: true,
                httpStatus: 429,
                code: 'VISION_RATE_LIMIT',
                safeMessage: 'Muitas requisições ao provedor de IA. Tente novamente em instantes.',
            }
        }
        if (status >= 500 && status <= 599) {
            return {
                kind: 'provider_unavailable',
                retryable: true,
                httpStatus: 502,
                code: 'VISION_PROVIDER_UNAVAILABLE',
                safeMessage: 'Provedor de IA temporariamente indisponível. Tentando novamente.',
            }
        }
        return {
            kind: status === 400 ? 'bad_request' : 'unknown',
            retryable: status >= 500,
            httpStatus: status === 400 ? 400 : 502,
            code: 'VISION_PROVIDER_ERROR',
            safeMessage: 'Falha ao analisar a imagem com o provedor de IA.',
        }
    }

    const msg = lowerMessage(err)
    const status = statusFromUnknown(err)

    if (err instanceof Error && err.name === 'AbortError') {
        return { kind: 'timeout', retryable: true, httpStatus: 504, code: 'VISION_TIMEOUT', safeMessage: 'Tempo excedido ao analisar a imagem. Tente novamente.' }
    }

    if (status === 429 || msg.includes('rate limit') || msg.includes('429')) {
        return { kind: 'rate_limited', retryable: true, httpStatus: 429, code: 'VISION_RATE_LIMIT', safeMessage: 'Muitas requisições. Tente novamente em instantes.' }
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
        return { kind: 'timeout', retryable: true, httpStatus: 504, code: 'VISION_TIMEOUT', safeMessage: 'Tempo excedido ao analisar a imagem. Tente novamente.' }
    }

    if (
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('econnreset') ||
        msg.includes('enotfound') ||
        msg.includes('eai_again')
    ) {
        return { kind: 'network', retryable: true, httpStatus: 502, code: 'VISION_NETWORK', safeMessage: 'Falha de rede ao analisar a imagem. Tente novamente.' }
    }

    if (status && status >= 500 && status <= 599) {
        return { kind: 'provider_unavailable', retryable: true, httpStatus: 502, code: 'VISION_PROVIDER_UNAVAILABLE', safeMessage: 'Provedor temporariamente indisponível. Tente novamente.' }
    }

    if (err instanceof ImageInadequateError) {
        return {
            kind: 'inadequate_image',
            retryable: false,
            httpStatus: 422,
            code: 'INADEQUATE_IMAGE',
            safeMessage: err.message,
            details: err.details,
        }
    }

    if (msg.includes('image') || msg.includes('invalid')) {
        return {
            kind: 'bad_request',
            retryable: false,
            httpStatus: 400,
            code: 'VISION_INVALID_IMAGE',
            safeMessage: 'Formato de imagem inválido. Tente outra imagem.',
        }
    }

    return {
        kind: 'unknown',
        retryable: false,
        httpStatus: 500,
        code: 'VISION_UNKNOWN',
        safeMessage: 'Falha ao analisar a imagem.',
    }
}

