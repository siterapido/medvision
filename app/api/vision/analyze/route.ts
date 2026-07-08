import { APICallError } from 'ai'

import { buildVisionModelChain, hasMedVisionOpenCodeGoKey } from '@/lib/ai/opencode-go'
import { deductCredits } from '@/lib/credits/service'
import { getSpecialtyConfig } from '@/lib/constants/vision-specialties'
import { buildVisionUserContext } from '@/lib/vision/build-analysis-context'
import { ImageInadequateError } from '@/lib/vision/pipeline'
import { visionAnalysisRequestSchema } from '@/lib/types/vision-analysis-request'
import { validateAndMergeDetections } from '@/lib/vision/detection-validation'
import { validateImagePayload } from '@/lib/vision/json-utils'
import { normalizeVisionImageDataUrl, compressToMax } from '@/lib/vision/normalize-image'
import {
    callTwoStageVisionAnalysis,
    callVisionAI,
    callVisionDetection,
    callVisionRefinement,
    mapAnalysisToResponse,
} from '@/lib/vision/pipeline'
import type { VisionAnalysis } from '@/lib/vision/schemas'
import {
    elapseMs,
    imagePayloadStats,
    getStructuredVisionOutputFromEnv,
    visionError,
    visionInfo,
    visionWarn,
    logVisionCall,
    estimateCost,
    extractTokenUsage,
    type VisionCallLog,
} from '@/lib/vision/vision-log'
import { classifyVisionError } from '@/lib/vision/vision-errors'
import { createClient } from '@/lib/supabase/server'
import { buildCacheKey, getCachedResult, setCachedResult } from '@/lib/vision/cache'
import {
    checkUsageLimit,
    incrementUsageCounter,
    usagePercent,
    shouldAlert,
} from '@/lib/vision/rate-limit'

export const maxDuration = 300

export async function POST(req: Request) {
    const requestStart = performance.now()
    const requestId = crypto.randomUUID().slice(0, 8)
    let userId: string | undefined
    let modelsToUse: string[] = []
    let imageData: string = ''
    let analysisSuccess = false

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }
        userId = user.id

        const body = await req.json()
        const parsed = visionAnalysisRequestSchema.safeParse(body)
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const {
            image,
            clinicalContext,
            specialty,
            modality,
            reportDepth,
            focusTags,
            patientAge,
            patientSex,
            reportSections,
            mode,
            originalAnalysisSummary,
        } = parsed.data

        // ── Rate Limit Check (entregável 7) ──
        const usageCheck = await checkUsageLimit(userId)
        if (!usageCheck.allowed) {
            visionWarn('request.rate_limited', {
                requestId,
                userId8: user.id.slice(0, 8),
                dailyUsed: usageCheck.dailyUsed,
                dailyLimit: usageCheck.dailyLimit,
                weeklyUsed: usageCheck.weeklyUsed,
                weeklyLimit: usageCheck.weeklyLimit,
                reason: usageCheck.reason,
            })
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VISION_RATE_LIMIT_USER',
                        message: usageCheck.reason ?? 'Limite de análises atingido.',
                        retryable: false,
                        details: {
                            dailyUsed: usageCheck.dailyUsed,
                            dailyLimit: usageCheck.dailyLimit,
                            weeklyUsed: usageCheck.weeklyUsed,
                            weeklyLimit: usageCheck.weeklyLimit,
                        },
                    },
                }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' },
                },
            )
        }

        const specialtyConfig = getSpecialtyConfig(specialty)
        const userContext = buildVisionUserContext({
            clinicalContext,
            modality,
            reportDepth,
            focusTags,
            patientAge,
            patientSex,
            reportSections,
        })

        imageData = image
        if (!image.startsWith('data:') && !image.startsWith('http')) {
            imageData = `data:image/jpeg;base64,${image}`
        }

        if (imageData.startsWith('data:image/')) {
            try {
                imageData = await normalizeVisionImageDataUrl(imageData)
            } catch {
                /* mantém original */
            }
        }

        const beforeCompressionStats = imagePayloadStats(imageData)
        let wasCompressed = false
        if (beforeCompressionStats.approxBytes > 2 * 1024 * 1024) {
            visionInfo('request.compress_aggressive', { requestId, originalBytes: beforeCompressionStats.approxBytes })
            imageData = await compressToMax(imageData, 500 * 1024)
            wasCompressed = true
        }

        const payloadCheck = validateImagePayload(imageData)
        if (!payloadCheck.valid) {
            visionWarn('request.payload_invalid', { requestId, message: payloadCheck.message })
            return new Response(JSON.stringify({ error: payloadCheck.message }), {
                status: 413,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        if (!hasMedVisionOpenCodeGoKey()) {
            visionWarn('config.missing_opencode_go', { requestId })
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'VISION_API_NOT_CONFIGURED',
                        message: 'Serviço de análise de imagem não disponível. Contate o suporte.',
                    },
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                },
            )
        }

        modelsToUse = [...buildVisionModelChain()]
        const payloadStats = imagePayloadStats(imageData)
        const hasContext = Boolean(userContext?.trim() || clinicalContext?.trim())
        const contextChars = userContext?.length ?? clinicalContext?.trim().length ?? 0
        visionInfo('request.start', {
            requestId,
            userId8: user.id.slice(0, 8),
            mode: mode ?? 'default',
            specialty: specialty ?? 'default',
            modelChain: modelsToUse.join(' → '),
            structuredOutput: getStructuredVisionOutputFromEnv(),
            hasClinicalContext: hasContext,
            clinicalContextChars: contextChars,
            wasCompressed,
            originalBytes: beforeCompressionStats.approxBytes,
            dailyUsed: usageCheck.dailyUsed,
            dailyLimit: usageCheck.dailyLimit,
            usagePercent: usagePercent(usageCheck.dailyUsed, usageCheck.dailyLimit),
            ...payloadStats,
        })

        // ── Cache Check (entregável 4) ──
        const cacheKey = buildCacheKey(imageData, clinicalContext)
        const cached = getCachedResult<VisionAnalysis>(cacheKey)
        if (cached) {
            visionInfo('request.cache_hit', {
                requestId,
                cacheKey: cacheKey.slice(0, 32),
                cachedMs: cached.analysisMs,
                cacheAgeMinutes: Math.round((Date.now() - cached.createdAt) / 60000),
            })
            const responseData = mapAnalysisToResponse(cached.result, { pipelineWarnings: [] })
            analysisSuccess = true
            const totalMs = elapseMs(requestStart)
            logVisionCall({
                requestId,
                modelId: cached.modelId,
                phase: 'cached',
                attempt: 0,
                totalAttempts: 0,
                latencyMs: cached.analysisMs,
                tokens: cached.tokenUsage,
                costEstimate: cached.tokenUsage
                    ? estimateCost(cached.modelId, cached.tokenUsage.input, cached.tokenUsage.output)
                    : undefined,
                structuredOutput: getStructuredVisionOutputFromEnv(),
                schemaValidation: 'pass',
                cacheHit: true,
                payloadBytes: payloadStats.approxBytes,
                wasCompressed,
                mode: mode ?? 'default',
                hasClinicalContext: hasContext,
                totalRequestMs: totalMs,
            })
            return Response.json({
                ...responseData,
                modelId: cached.modelId,
                cached: true,
                cacheAgeMinutes: Math.round((Date.now() - cached.createdAt) / 60000),
            })
        }

        // ── Análise (modos: refine, quick, preview, detailed, default) ──
        let analysis: VisionAnalysis
        let pipelineWarnings: string[] = []
        const structuredOutput = getStructuredVisionOutputFromEnv()

        if (mode === 'refine' && originalAnalysisSummary) {
            visionInfo('request.mode', { requestId, mode: 'refine' })
            analysis = await callVisionRefinement(imageData, originalAnalysisSummary, clinicalContext, modelsToUse, specialtyConfig, userContext)
        } else if (mode === 'quick') {
            visionInfo('request.mode', { requestId, mode: 'quick' })
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig, userContext)
        } else if (mode === 'preview') {
            visionInfo('request.mode', { requestId, mode: 'preview' })
            const quickResult = await callVisionDetection(imageData, clinicalContext, modelsToUse, specialtyConfig, userContext)
            const validatedDetections = validateAndMergeDetections(
                quickResult.quickDetections.map((d, i) => ({
                    id: `det-${i}`,
                    label: d.label,
                    box: d.box,
                    confidence: d.confidence,
                    severity: d.severity,
                    anatomicalRegion: d.anatomicalRegion as string | undefined,
                })),
            )

            const previewResponse = {
                meta: quickResult.meta,
                detections: validatedDetections.map((d) => ({
                    id: d.id as string,
                    label: d.label,
                    confidence: d.confidence,
                    box: {
                        ymin: d.box[0],
                        xmin: d.box[1],
                        ymax: d.box[2],
                        xmax: d.box[3],
                    },
                    severity: d.severity,
                    anatomicalRegion: d.anatomicalRegion as string | undefined,
                })),
                isPreview: true,
            }

            analysisSuccess = true

            // Deduct credits only on successful analysis
            try {
                await deductCredits(user.id, modelsToUse[0], 'vision', 'Preview de detecção')
            } catch (e) {
                visionWarn('credits.deduct_failed', { requestId, mode: 'preview', message: e instanceof Error ? e.message : String(e) })
            }

            // Increment usage counter
            incrementUsageCounter(user.id)

            // Alerta de uso (entregável 7)
            const pct = usagePercent(usageCheck.dailyUsed + 1, usageCheck.dailyLimit)
            const alertMsg = shouldAlert(pct) ? `Atenção: você usou ${pct}% do seu limite diário de análises (${usageCheck.dailyUsed + 1}/${usageCheck.dailyLimit}).` : undefined

            visionInfo('request.done', {
                requestId,
                mode: 'preview',
                totalMs: elapseMs(requestStart),
                previewDetections: previewResponse.detections.length,
            })
            return Response.json({
                ...previewResponse,
                usageAlert: alertMsg,
                usage: {
                    dailyUsed: usageCheck.dailyUsed + 1,
                    dailyLimit: usageCheck.dailyLimit,
                    usagePercent: pct,
                },
            })
        } else if (mode === 'detailed') {
            visionInfo('request.mode', { requestId, mode: 'detailed_two_stage' })
            const twoStage = await callTwoStageVisionAnalysis(imageData, clinicalContext, modelsToUse, specialtyConfig, userContext)
            analysis = twoStage.analysis
            pipelineWarnings = twoStage.warnings
        } else {
            visionInfo('request.mode', { requestId, mode: 'default_single_pass' })
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig, userContext)
        }

        // ── Sucesso: persistir cache, debitar créditos, logging ──
        analysisSuccess = true

        // Cache result
        const analysisMs = elapseMs(requestStart)
        setCachedResult(cacheKey, analysis, modelsToUse[0], analysisMs)

        // Debitar créditos (só em sucesso — fix P0-2)
        try {
            await deductCredits(user.id, modelsToUse[0], 'vision')
        } catch (e) {
            visionWarn('credits.deduct_failed', { requestId, message: e instanceof Error ? e.message : String(e) })
        }

        // Increment usage counter
        incrementUsageCounter(user.id)

        const responseData = mapAnalysisToResponse(analysis, { pipelineWarnings })

        // Structured call log (entregável 5)
        const totalMs = elapseMs(requestStart)
        logVisionCall({
            requestId,
            modelId: modelsToUse[0],
            phase: mode === 'detailed' ? 'two_stage' : 'single_pass',
            attempt: 1,
            totalAttempts: modelsToUse.length,
            latencyMs: analysisMs,
            structuredOutput,
            schemaValidation: 'pass',
            cacheHit: false,
            payloadBytes: payloadStats.approxBytes,
            wasCompressed,
            mode: mode ?? 'default',
            hasClinicalContext: hasContext,
            totalRequestMs: totalMs,
        })

        // Alerta de uso (entregável 7)
        const pct = usagePercent(usageCheck.dailyUsed + 1, usageCheck.dailyLimit)
        const alertMsg = shouldAlert(pct)
            ? `Atenção: você usou ${pct}% do seu limite diário de análises (${usageCheck.dailyUsed + 1}/${usageCheck.dailyLimit}).`
            : undefined

        visionInfo('request.done', {
            requestId,
            mode: mode ?? 'default',
            totalMs,
            detections: analysis.detections.length,
            precision: responseData.precision,
            pipelineWarnings: pipelineWarnings.length,
            cached: false,
        })

        return Response.json({
            ...responseData,
            modelId: modelsToUse[0],
            usageAlert: alertMsg,
            usage: {
                dailyUsed: usageCheck.dailyUsed + 1,
                dailyLimit: usageCheck.dailyLimit,
                usagePercent: pct,
            },
        })
    } catch (error: unknown) {
        // ── Erro: NÃO debitar créditos (fix P0-2) ──
        // Créditos só são debitados em sucesso. Erros do provedor não cobram.
        visionError('request.error', error, {
            requestId,
            totalMs: elapseMs(requestStart),
            analysisSuccess,
        })

        const classified = classifyVisionError(error)

        // Só debita em erros que NÃO são do provedor (ex: parse error = nosso problema)
        // E mesmo assim, prefere não debitar — fail-safe
        const shouldDeductOnError = false // was: !skipCredits && userId

        if (shouldDeductOnError && userId) {
            try {
                await deductCredits(userId, modelsToUse[0] || 'default', 'vision')
            } catch (e) {
                visionWarn('credits.deduct_failed', { requestId, message: e instanceof Error ? e.message : String(e) })
            }
        }

        if (!analysisSuccess) {
            visionInfo('request.skipped_credits', { requestId, reason: 'analysis_failed' })
        }

        // Structured error log (entregável 5)
        logVisionCall({
            requestId,
            modelId: modelsToUse[0] || 'unknown',
            phase: modeFromError(error),
            attempt: modelsToUse.length,
            totalAttempts: modelsToUse.length,
            latencyMs: elapseMs(requestStart),
            structuredOutput: getStructuredVisionOutputFromEnv(),
            schemaValidation: 'fail',
            cacheHit: false,
            wasCompressed: false,
            mode: 'error',
            hasClinicalContext: false,
            totalRequestMs: elapseMs(requestStart),
        })

        const errorDetails =
            process.env.NODE_ENV === 'development'
                ? APICallError.isInstance(error)
                    ? `${error.message} | status=${error.statusCode} | url=${error.url}`
                    : error instanceof Error
                      ? error.message
                      : String(error)
                : undefined

        return new Response(
            JSON.stringify({
                requestId,
                error: {
                    code: classified.code,
                    message: classified.safeMessage,
                    retryable: classified.retryable,
                    ...(classified.details ? { details: classified.details } : {}),
                },
                details: errorDetails,
            }),
            {
                status: classified.httpStatus,
                headers: { 'Content-Type': 'application/json' },
            },
        )
    }
}

function modeFromError(_error: unknown): string {
    return 'error'
}
