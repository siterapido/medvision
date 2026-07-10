import type { VisionAnalysisResult } from '@/lib/types/vision'

const POLL_MS = 2000
const MAX_WAIT_MS = 280_000

type AnalyzeErrorBody = {
  error?: string | { code?: string; message?: string; details?: unknown }
  details?: string
  limit?: number
  used?: number
}

function throwFromErrorResponse(status: number, errData: AnalyzeErrorBody): never {
  if (status === 402 || errData?.error === 'credits_exhausted') {
    throw new Error(
      'Créditos insuficientes. Você atingiu o limite mensal do seu plano. Faça upgrade para continuar.',
    )
  }
  if (status === 429) {
    const limit = errData?.limit
    const used = errData?.used
    const limitInfo = limit ? ` (${used}/${limit} hoje)` : ''
    const msg =
      typeof errData?.error === 'object'
        ? errData.error?.message
        : errData?.error
    throw new Error(msg || `Limite diário atingido${limitInfo}. Faça upgrade para Pro.`)
  }
  if (status === 413) {
    throw new Error('Imagem muito grande. Tente comprimir ou usar uma imagem menor.')
  }
  if (status === 504) {
    throw new Error('Tempo excedido. Tente com uma imagem menor ou tente novamente.')
  }

  const errorCode = typeof errData?.error === 'object' ? errData.error?.code : undefined
  const errorMessage =
    typeof errData?.error === 'object' ? errData.error?.message : errData?.error
  const errorDetail = errData?.details

  const errorMessages: Record<string, string> = {
    VISION_PROVIDER_AUTH: 'Erro de configuração. Contate o suporte.',
    VISION_RATE_LIMIT: 'Muitas requisições. Aguarde um momento e tente novamente.',
    VISION_PROVIDER_UNAVAILABLE:
      'Serviço de IA temporariamente indisponível. Tente novamente em instantes.',
    VISION_TIMEOUT: 'Tempo excedido ao analisar. Tente com uma imagem menor.',
    VISION_NETWORK: 'Erro de conexão. Verifique sua internet.',
    VISION_PARSE_ERROR: 'Erro ao processar resposta. Tente novamente.',
    INADEQUATE_IMAGE: 'Esta imagem não é adequada para análise.',
    RATE_LIMIT: 'Limite de análises atingido. Tente novamente mais tarde.',
    INSUFFICIENT_CREDITS: 'Créditos insuficientes para esta análise.',
  }

  const friendlyMsg = errorCode ? errorMessages[errorCode] : null
  const errorMsg =
    friendlyMsg || errorMessage || errorDetail || `Falha na análise (${status})`
  const err = new Error(typeof errorMsg === 'string' ? errorMsg : 'Falha ao analisar imagem') as Error & {
    code?: string
    details?: unknown
  }
  if (errorCode) err.code = errorCode
  if (typeof errData?.error === 'object') err.details = errData.error?.details
  throw err
}

async function pollVisionRun(runId: string): Promise<VisionAnalysisResult> {
  const started = Date.now()
  while (Date.now() - started < MAX_WAIT_MS) {
    const res = await fetch(`/api/vision/runs/${encodeURIComponent(runId)}`, {
      credentials: 'include',
    })
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    const data = await res.json().catch(() => ({}))
    if (data.status === 'completed' && data.result) {
      return data.result as VisionAnalysisResult
    }
    if (data.status === 'failed' || data.status === 'cancelled' || res.status >= 500) {
      throw new Error(data.error || `Análise ${data.status || 'falhou'}`)
    }
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  throw new Error('Tempo excedido aguardando a análise. Tente novamente.')
}

/**
 * Starts durable vision workflow and polls until complete.
 * Falls back to sync `/api/vision/analyze` if async endpoint unavailable.
 */
export async function runVisionAnalysis(
  body: Record<string, unknown>,
): Promise<VisionAnalysisResult & { precision?: number }> {
  const asyncRes = await fetch('/api/vision/analyze-async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (asyncRes.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  // Fallback: sync path if workflow route missing / misconfigured
  if (asyncRes.status === 404 || asyncRes.status === 501) {
    const syncRes = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!syncRes.ok) {
      const errData = await syncRes.json().catch(() => ({}))
      throwFromErrorResponse(syncRes.status, errData)
    }
    return (await syncRes.json()) as VisionAnalysisResult & { precision?: number }
  }

  if (!asyncRes.ok) {
    const errData = await asyncRes.json().catch(() => ({}))
    throwFromErrorResponse(asyncRes.status, errData)
  }

  const { runId } = (await asyncRes.json()) as { runId?: string }
  if (!runId) {
    throw new Error('Falha ao iniciar análise durável (sem runId)')
  }

  return pollVisionRun(runId)
}
