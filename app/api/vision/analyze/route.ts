import { APICallError } from 'ai'

import { buildVisionModelChain, hasMedVisionOpenRouterKey } from '@/lib/ai/openrouter'
import { deductCredits } from '@/lib/credits/service'
import { ImageInadequateError } from '@/lib/vision/pipeline'
import { getSpecialtyConfig } from '@/lib/constants/vision-specialties'
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
} from '@/lib/vision/vision-log'
import { classifyVisionError } from '@/lib/vision/vision-errors'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function POST(req: Request) {
    const requestStart = performance.now()
    const requestId = crypto.randomUUID().slice(0, 8)
    let userId: string | undefined
    let modelsToUse: string[] = []
    let imageData: string = ''

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
        const { image, clinicalContext, mode, originalAnalysisSummary, model, specialty } = body
        const specialtyConfig = getSpecialtyConfig(specialty)

        if (!image) {
            return new Response(JSON.stringify({ error: 'Image data is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

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
        if (beforeCompressionStats.approxBytes > 2 * 1024 * 1024) {
            visionInfo('request.compress_aggressive', { requestId, originalBytes: beforeCompressionStats.approxBytes })
            imageData = await compressToMax(imageData, 500 * 1024)
        }

        const payloadCheck = validateImagePayload(imageData)
        if (!payloadCheck.valid) {
            visionWarn('request.payload_invalid', { requestId, message: payloadCheck.message })
            return new Response(JSON.stringify({ error: payloadCheck.message }), {
                status: 413,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        if (!hasMedVisionOpenRouterKey()) {
            visionWarn('config.missing_openrouter', { requestId })
            return new Response(JSON.stringify({
                error: {
                    code: 'VISION_API_NOT_CONFIGURED',
                    message: 'Serviço de análise de imagem não disponível. Contate o suporte.',
                }
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const modelsToUse = buildVisionModelChain(typeof model === 'string' ? model : undefined)
        const payloadStats = imagePayloadStats(imageData)
        const wasCompressed = beforeCompressionStats.approxBytes > 2 * 1024 * 1024
        visionInfo('request.start', {
            requestId,
            userId8: user.id.slice(0, 8),
            mode: typeof mode === 'string' ? mode : 'default',
            specialty: typeof specialty === 'string' ? specialty : 'default',
            modelChain: modelsToUse.join(' → '),
            structuredOutput: getStructuredVisionOutputFromEnv(),
            hasClinicalContext: Boolean(typeof clinicalContext === 'string' && clinicalContext.trim()),
            clinicalContextChars: typeof clinicalContext === 'string' ? clinicalContext.trim().length : 0,
            wasCompressed,
            originalBytes: beforeCompressionStats.approxBytes,
            ...payloadStats,
        })

        let analysis: VisionAnalysis
        let pipelineWarnings: string[] = []

        if (mode === 'refine' && originalAnalysisSummary) {
            visionInfo('request.mode', { requestId, mode: 'refine' })
            analysis = await callVisionRefinement(imageData, originalAnalysisSummary, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'quick') {
            visionInfo('request.mode', { requestId, mode: 'quick' })
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'preview') {
            visionInfo('request.mode', { requestId, mode: 'preview' })
            const quickResult = await callVisionDetection(imageData, clinicalContext, modelsToUse, specialtyConfig)
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
            try {
                await deductCredits(user.id, modelsToUse[0], 'vision', 'Preview de detecção')
            } catch (e) {
                visionWarn('credits.deduct_failed', { requestId, mode: 'preview', message: e instanceof Error ? e.message : String(e) })
            }
            visionInfo('request.done', {
                requestId,
                mode: 'preview',
                totalMs: elapseMs(requestStart),
                previewDetections: previewResponse.detections.length,
            })
            return Response.json(previewResponse)
        } else if (mode === 'detailed') {
            visionInfo('request.mode', { requestId, mode: 'detailed_two_stage' })
            const twoStage = await callTwoStageVisionAnalysis(imageData, clinicalContext, modelsToUse, specialtyConfig)
            analysis = twoStage.analysis
            pipelineWarnings = twoStage.warnings
        } else {
            visionInfo('request.mode', { requestId, mode: 'default_single_pass' })
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig)
        }

        try {
            await deductCredits(user.id, modelsToUse[0], 'vision')
        } catch (e) {
            visionWarn('credits.deduct_failed', { requestId, message: e instanceof Error ? e.message : String(e) })
        }

        const responseData = mapAnalysisToResponse(analysis, { pipelineWarnings })
        visionInfo('request.done', {
            requestId,
            mode: typeof mode === 'string' ? mode : 'default',
            totalMs: elapseMs(requestStart),
            detections: analysis.detections.length,
            precision: responseData.precision,
            pipelineWarnings: pipelineWarnings.length,
        })
        return Response.json({ ...responseData, modelId: modelsToUse[0] })
    } catch (error: unknown) {
        visionError('request.error', error, { requestId })

        const classified = classifyVisionError(error)
        const skipCredits = error instanceof ImageInadequateError

        if (!skipCredits && userId) {
            try {
                await deductCredits(userId, modelsToUse[0] || 'default', 'vision')
            } catch (e) {
                visionWarn('credits.deduct_failed', { requestId, message: e instanceof Error ? e.message : String(e) })
            }
        } else if (skipCredits) {
            visionInfo('request.skipped_credits', { requestId, reason: 'inadequate_image' })
        }

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
