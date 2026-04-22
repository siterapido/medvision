import { hasMedVisionOpenRouterKey, VISION_MODEL_IDS } from '@/lib/ai/openrouter'
import { deductCredits } from '@/lib/credits/service'
import { getSpecialtyConfig } from '@/lib/constants/vision-specialties'
import { validateAndMergeDetections } from '@/lib/vision/detection-validation'
import { validateImagePayload } from '@/lib/vision/json-utils'
import { normalizeVisionImageDataUrl } from '@/lib/vision/normalize-image'
import {
    callTwoStageVisionAnalysis,
    callVisionAI,
    callVisionDetection,
    callVisionRefinement,
    mapAnalysisToResponse,
    VISION_MODELS,
} from '@/lib/vision/pipeline'
import type { VisionAnalysis } from '@/lib/vision/schemas'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 120

export async function POST(req: Request) {
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

        const body = await req.json()
        const { image, clinicalContext, mode, originalAnalysisSummary, model, specialty } = body
        const specialtyConfig = getSpecialtyConfig(specialty)

        if (!image) {
            return new Response(JSON.stringify({ error: 'Image data is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        let imageData = image
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

        const payloadCheck = validateImagePayload(imageData)
        if (!payloadCheck.valid) {
            return new Response(JSON.stringify({ error: payloadCheck.message }), {
                status: 413,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        if (!hasMedVisionOpenRouterKey()) {
            console.error('Vision analysis error: configure MEDVISION_OPENROUTER_API_KEY ou OPENROUTER_API_KEY')
            return new Response(JSON.stringify({ error: 'API not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const modelsToUse: readonly string[] = model && VISION_MODEL_IDS.has(model) ? [model] : VISION_MODELS

        let analysis: VisionAnalysis
        let pipelineWarnings: string[] = []

        if (mode === 'refine' && originalAnalysisSummary) {
            console.log('Mode: refine - usando callVisionRefinement')
            analysis = await callVisionRefinement(imageData, originalAnalysisSummary, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'quick') {
            console.log('Mode: quick - usando callVisionAI (single-pass)')
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'preview') {
            console.log('Mode: preview - usando callVisionDetection (detecção rápida)')
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
            await deductCredits(user.id, modelsToUse[0], 'vision', 'Preview de detecção')
            return Response.json(previewResponse)
        } else {
            console.log('Mode: default (two-stage) - usando callTwoStageVisionAnalysis')
            const twoStage = await callTwoStageVisionAnalysis(imageData, clinicalContext, modelsToUse, specialtyConfig)
            analysis = twoStage.analysis
            pipelineWarnings = twoStage.warnings
        }

        await deductCredits(user.id, modelsToUse[0], 'vision')

        const responseData = mapAnalysisToResponse(analysis, { pipelineWarnings })
        return Response.json({ ...responseData, modelId: modelsToUse[0] })
    } catch (error: unknown) {
        console.error('Vision analysis error:', error)

        let errorMessage = 'Failed to analyze image'
        let statusCode = 500
        let errorDetails = ''

        if (error instanceof Error) {
            errorDetails = error.message
            if (error.message.includes('API key')) {
                errorMessage = 'API key configuration error'
            } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please try again later.'
                statusCode = 429
            } else if (error.message.includes('model') || error.message.includes('not found')) {
                errorMessage = 'Vision model not available'
            } else if (error.message.includes('image') || error.message.includes('Invalid')) {
                errorMessage = 'Invalid image format. Please try a different image.'
                statusCode = 400
            }
        }

        if (error && typeof error === 'object' && 'cause' in error) {
            console.error('Error cause:', error.cause)
            errorDetails += ` | Cause: ${JSON.stringify(error.cause)}`
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
            }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' },
            },
        )
    }
}
