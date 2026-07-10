/**
 * Durable Med Vision analysis workflow.
 * Steps have full Node access + automatic retry; workflow orchestrates only.
 */

import { FatalError } from 'workflow'
import { getSpecialtyConfig } from '@/lib/constants/vision-specialties'
import { buildCacheKey, getCachedResultAsync, setCachedResultAsync } from '@/lib/vision/cache'
import { validateAndMergeDetections } from '@/lib/vision/detection-validation'
import {
  callTwoStageVisionAnalysis,
  callVisionAI,
  callVisionDetection,
  callVisionRefinement,
  mapAnalysisToResponse,
} from '@/lib/vision/pipeline'
import type { VisionAnalysis } from '@/lib/vision/schemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { deductCredits } from '@/lib/credits/service'
import { incrementUsageCounter } from '@/lib/vision/rate-limit'

export type VisionWorkflowInput = {
  userId: string
  imageData: string
  clinicalContext?: string
  userContext?: string
  mode?: 'default' | 'detailed' | 'preview' | 'quick' | 'refine'
  specialty?: string | null
  models: string[]
  originalAnalysisSummary?: string
  requestId: string
}

export type VisionWorkflowResult = Record<string, unknown> & {
  modelId?: string
  cached?: boolean
}

async function lookupCache(input: VisionWorkflowInput): Promise<VisionWorkflowResult | null> {
  'use step'
  console.log('[vision-workflow] cache lookup', input.requestId)
  const cacheKey = buildCacheKey(input.imageData, input.clinicalContext)
  const cached = await getCachedResultAsync<VisionAnalysis>(cacheKey)
  if (!cached) return null
  const responseData = mapAnalysisToResponse(cached.result, { pipelineWarnings: [] })
  return {
    ...responseData,
    modelId: cached.modelId,
    cached: true,
    cacheAgeMinutes: Math.round((Date.now() - cached.createdAt) / 60000),
  }
}

async function runAnalysis(input: VisionWorkflowInput): Promise<{
  analysis: VisionAnalysis
  pipelineWarnings: string[]
  modelId: string
}> {
  'use step'
  console.log('[vision-workflow] analyze start', input.requestId, input.mode ?? 'default')

  const specialtyConfig = input.specialty
    ? getSpecialtyConfig(input.specialty as Parameters<typeof getSpecialtyConfig>[0])
    : undefined

  const models = input.models
  const clinicalContext = input.clinicalContext
  const userContext = input.userContext
  const imageData = input.imageData
  let analysis: VisionAnalysis
  let pipelineWarnings: string[] = []

  try {
    if (input.mode === 'refine' && input.originalAnalysisSummary) {
      analysis = await callVisionRefinement(
        imageData,
        input.originalAnalysisSummary,
        clinicalContext,
        models,
        specialtyConfig,
        userContext,
      )
    } else if (input.mode === 'quick') {
      analysis = await callVisionAI(imageData, clinicalContext, models, specialtyConfig, userContext)
    } else if (input.mode === 'preview') {
      const quickResult = await callVisionDetection(
        imageData,
        clinicalContext,
        models,
        specialtyConfig,
        userContext,
      )
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
      analysis = {
        report: {
          technicalAnalysis: 'Pré-visualização rápida — laudo completo disponível no modo padrão.',
          detailedFindings: validatedDetections.map((d) => d.label).join('; ') || 'Sem achados na prévia.',
          diagnosticHypothesis: 'Prévia de detecção',
          recommendations: [],
        },
        meta: quickResult.meta,
        detections: validatedDetections,
      } as VisionAnalysis
    } else if (input.mode === 'detailed') {
      const twoStage = await callTwoStageVisionAnalysis(
        imageData,
        clinicalContext,
        models,
        specialtyConfig,
        userContext,
      )
      analysis = twoStage.analysis
      pipelineWarnings = twoStage.warnings ?? []
    } else {
      analysis = await callVisionAI(imageData, clinicalContext, models, specialtyConfig, userContext)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/inadequate|não adequada|inadequate_image/i.test(message)) {
      throw new FatalError(message)
    }
    throw err
  }

  const modelId = models[0] ?? 'unknown'
  console.log('[vision-workflow] analyze done', input.requestId)
  return { analysis, pipelineWarnings, modelId }
}

async function persistCacheAndUsage(
  input: VisionWorkflowInput,
  analysis: VisionAnalysis,
  modelId: string,
): Promise<void> {
  'use step'
  console.log('[vision-workflow] persist', input.requestId)
  const cacheKey = buildCacheKey(input.imageData, input.clinicalContext)
  await setCachedResultAsync(cacheKey, analysis, modelId, 0)

  incrementUsageCounter(input.userId)

  try {
    const supabase = createAdminClient()
    await supabase.from('vision_usage_log').insert({
      user_id: input.userId,
      model: modelId,
      specialty: input.specialty ?? null,
      cached: false,
    })
  } catch (e) {
    console.warn('[vision-workflow] usage_log failed', e)
  }

  try {
    await deductCredits(input.userId, modelId, 'vision', `Med Vision ${input.requestId}`)
  } catch (e) {
    console.warn('[vision-workflow] deductCredits failed', e)
  }
}

export async function visionAnalyzeWorkflow(
  input: VisionWorkflowInput,
): Promise<VisionWorkflowResult> {
  'use workflow'

  console.log('[vision-workflow] start', input.requestId)

  const cached = await lookupCache(input)
  if (cached) {
    console.log('[vision-workflow] cache hit', input.requestId)
    return cached
  }

  const { analysis, pipelineWarnings, modelId } = await runAnalysis(input)
  await persistCacheAndUsage(input, analysis, modelId)

  const responseData = mapAnalysisToResponse(analysis, { pipelineWarnings })
  console.log('[vision-workflow] complete', input.requestId)
  return {
    ...responseData,
    modelId,
    cached: false,
  }
}
