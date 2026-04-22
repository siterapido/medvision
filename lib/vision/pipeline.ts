import { generateObject, generateText } from 'ai'
import * as Sentry from '@sentry/nextjs'
import type { z } from 'zod'
import type { ZodType } from 'zod'
import { openrouterMedVision, DEFAULT_VISION_MODEL_CHAIN } from '@/lib/ai/openrouter'
import type { SpecialtyPrompts } from '@/lib/constants/vision-specialties'
import { validateAndMergeDetections } from '@/lib/vision/detection-validation'
import { extractJSON, sanitizeClinicalContext } from '@/lib/vision/json-utils'
import { callWithFallback } from '@/lib/vision/model-fallback'
import {
    DETAILED_ANALYSIS_PROMPT,
    DETAILED_ANALYSIS_SCHEMA,
    JSON_SCHEMA_EXAMPLE,
    QUICK_DETECTION_PROMPT,
    QUICK_DETECTION_SCHEMA,
    SYSTEM_PROMPT_BASE,
} from '@/lib/vision/prompts'
import { DetailedDetectionSchema, QuickDetectionSchema, VisionSchema, type VisionAnalysis } from '@/lib/vision/schemas'

export const VISION_MODELS = DEFAULT_VISION_MODEL_CHAIN

function buildUserContent(imageData: string, textParts: { type: 'text'; text: string }[]) {
    return [...textParts, { type: 'image' as const, image: imageData }]
}

function useStructuredVisionOutput(): boolean {
    return process.env.MEDVISION_STRUCTURED_OUTPUT !== '0'
}

async function tryGenerateObject<T>(
    schema: ZodType<T>,
    modelId: string,
    signal: AbortSignal,
    maxOutputTokens: number,
    systemContent: string,
    userContent: ReturnType<typeof buildUserContent>,
): Promise<T | null> {
    if (!useStructuredVisionOutput()) {
        return null
    }
    try {
        const { object } = await generateObject({
            model: openrouterMedVision(modelId),
            schema,
            abortSignal: signal,
            maxOutputTokens,
            messages: [
                { role: 'system' as const, content: systemContent },
                { role: 'user' as const, content: userContent },
            ],
        })
        return object
    } catch (e) {
        console.warn('generateObject failed, falling back to generateText:', e)
        return null
    }
}

export async function callVisionAI(
    imageData: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts,
): Promise<VisionAnalysis> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeSystemPrompt = prompts?.systemPrompt ?? SYSTEM_PROMPT_BASE

    const fullInstruction =
        prompts?.fullAnalysisUserInstruction ??
        'Gere um laudo de radiografia ou TC completo no JSON exigido pelo assistente. Responda SOMENTE com o JSON.'

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<VisionAnalysis> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            {
                type: 'text' as const,
                text: fullInstruction,
            },
        ]
        if (safeContext) {
            userTextParts.push({
                type: 'text' as const,
                text: `CONTEXTO CLÍNICO FORNECIDO PELO PROFISSIONAL:\n${safeContext}\n\nConsidere este contexto ao formular hipóteses diagnósticas e recomendações.`,
            })
        }

        const systemContent = `${activeSystemPrompt}

FORMATO DE RESPOSTA: Responda SOMENTE com JSON válido seguindo este schema exato:
${JSON_SCHEMA_EXAMPLE}

NÃO inclua markdown, code blocks, ou texto fora do JSON.`

        const userContent = buildUserContent(imageData, userTextParts)
        const structured = await tryGenerateObject(VisionSchema, modelId, signal, 8000, systemContent, userContent)
        if (structured) {
            return structured
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 8000,
            messages: [
                {
                    role: 'system' as const,
                    content: systemContent,
                },
                {
                    role: 'user' as const,
                    content: userContent,
                },
            ],
        })

        return VisionSchema.parse(extractJSON(result.text))
    }

    return callWithFallback(models, generateWithModel)
}

export async function callVisionRefinement(
    regionImageData: string,
    originalAnalysisSummary: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts,
): Promise<VisionAnalysis> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeSystemPrompt = prompts?.systemPrompt ?? SYSTEM_PROMPT_BASE

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<VisionAnalysis> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            {
                type: 'text' as const,
                text: 'RE-ANALISE esta região específica com máximo detalhe e precisão. Identifique achados sutis, forneça descrições técnicas aprofundadas, CID-10, diagnósticos diferenciais e ações recomendadas. As coordenadas devem ser relativas a esta imagem recortada. Responda SOMENTE com o JSON.',
            },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const systemContent = `${activeSystemPrompt}

MODO DE REFINAMENTO: Você está re-analisando uma REGIÃO ESPECÍFICA extraída de uma imagem médica maior (radiografia ou tomografia).
A análise original da imagem completa identificou: ${originalAnalysisSummary}

Sua tarefa agora é:
1. Focar EXCLUSIVAMENTE nesta região recortada com máximo detalhe
2. Identificar achados sutis que podem ter passado despercebidos na análise completa
3. Fornecer descrições ainda mais detalhadas dos achados visíveis nesta região
4. As coordenadas de bounding box devem ser relativas a ESTA imagem recortada (0-100)
5. Para imagens dentárias, detalhe cáries e perda óssea; para demais regiões, use terminologia radiológica adequada.

FORMATO DE RESPOSTA: Responda SOMENTE com JSON válido seguindo este schema exato:
${JSON_SCHEMA_EXAMPLE}

NÃO inclua markdown, code blocks, ou texto fora do JSON.`

        const userContent = buildUserContent(regionImageData, userTextParts)
        const structured = await tryGenerateObject(VisionSchema, modelId, signal, 4000, systemContent, userContent)
        if (structured) {
            return structured
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 4000,
            messages: [
                {
                    role: 'system' as const,
                    content: systemContent,
                },
                {
                    role: 'user' as const,
                    content: userContent,
                },
            ],
        })

        return VisionSchema.parse(extractJSON(result.text))
    }

    return callWithFallback(models, generateWithModel)
}

export async function callVisionDetection(
    imageData: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts,
): Promise<z.infer<typeof QuickDetectionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeQuickPrompt = prompts?.quickDetectionPrompt ?? QUICK_DETECTION_PROMPT

    const quickUser =
        prompts?.quickDetectionUserInstruction ??
        'Execute a detecção rápida conforme o assistente. Responda somente com o JSON solicitado.'

    const generateWithModel = async (modelId: string, signal: AbortSignal) => {
        const userTextParts: { type: 'text'; text: string }[] = [
            {
                type: 'text' as const,
                text: quickUser,
            },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const systemContent = `${activeQuickPrompt}

FORMATO: Responda SOMENTE com JSON válido:
${QUICK_DETECTION_SCHEMA}`

        const userContent = buildUserContent(imageData, userTextParts)
        const structured = await tryGenerateObject(QuickDetectionSchema, modelId, signal, 2000, systemContent, userContent)
        if (structured) {
            return structured
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 2000,
            messages: [
                {
                    role: 'system' as const,
                    content: systemContent,
                },
                {
                    role: 'user' as const,
                    content: userContent,
                },
            ],
        })

        return QuickDetectionSchema.parse(extractJSON(result.text))
    }

    return callWithFallback(models, generateWithModel)
}

export async function callVisionDetailedAnalysis(
    imageData: string,
    quickDetections: z.infer<typeof QuickDetectionSchema>['quickDetections'],
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts,
): Promise<z.infer<typeof DetailedDetectionSchema>> {
    const detectionsSummary = quickDetections
        .map((d, i) => `${i}: ${d.label} (${d.anatomicalRegion || 'N/A'}) - ${d.severity} - confiança ${Math.round(d.confidence * 100)}%`)
        .join('\n')

    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeDetailedPrompt = prompts?.detailedAnalysisPrompt ?? DETAILED_ANALYSIS_PROMPT

    const generateWithModel = async (modelId: string, signal: AbortSignal) => {
        const userTextParts: { type: 'text'; text: string }[] = [
            {
                type: 'text' as const,
                text: `Forneça análise detalhada para cada uma das ${quickDetections.length} detecções listadas acima. Para cada uma: CID-10, dados radiológicos quando aplicável, diagnóstico diferencial, significância clínica, ações recomendadas e descrição técnica.`,
            },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const systemContent = `${activeDetailedPrompt}

DETECÇÕES DO ESTÁGIO 1:
${detectionsSummary}

IMAGEM A ANALISAR:

FORMATO: Responda SOMENTE com JSON válido:
${DETAILED_ANALYSIS_SCHEMA}`

        const userContent = buildUserContent(imageData, userTextParts)
        const structured = await tryGenerateObject(DetailedDetectionSchema, modelId, signal, 3500, systemContent, userContent)
        if (structured) {
            return structured
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 3500,
            messages: [
                {
                    role: 'system' as const,
                    content: systemContent,
                },
                {
                    role: 'user' as const,
                    content: userContent,
                },
            ],
        })

        return DetailedDetectionSchema.parse(extractJSON(result.text))
    }

    return callWithFallback(models, generateWithModel)
}

const normalizeLabel = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

const LAUDO_KEYWORDS: { pattern: RegExp; type: string; severity: 'critical' | 'moderate' | 'normal' }[] = [
    { pattern: /pneumonia|consolidação|consolidacao/gi, type: 'Pneumonia / Consolidação', severity: 'moderate' },
    { pattern: /derrame pleural|derrame/gi, type: 'Derrame Pleural', severity: 'moderate' },
    { pattern: /pneumotórax|pneumotorax/gi, type: 'Pneumotórax', severity: 'critical' },
    { pattern: /nódulo|nodulo|massa pulmonar/gi, type: 'Nódulo / Massa', severity: 'moderate' },
    { pattern: /fratura/gi, type: 'Fratura', severity: 'critical' },
    { pattern: /atelectasia/gi, type: 'Atelectasia', severity: 'moderate' },
    { pattern: /cardiomegalia/gi, type: 'Cardiomegalia', severity: 'moderate' },
    { pattern: /opacidade|infiltrado/gi, type: 'Opacidade / Infiltrado', severity: 'moderate' },
    { pattern: /calcificação|calcificacao/gi, type: 'Calcificação', severity: 'normal' },
    { pattern: /cisto|lesão cística/gi, type: 'Lesão Cística', severity: 'moderate' },
]

export async function callTwoStageVisionAnalysis(
    imageData: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts,
): Promise<{ analysis: VisionAnalysis; warnings: string[] }> {
    const warnings: string[] = []
    console.log('=== ESTÁGIO 1: Detecção Rápida ===')
    const quickResult = await callVisionDetection(imageData, clinicalContext, models, prompts)
    console.log(`Estágio 1 concluído: ${quickResult.quickDetections.length} detecções encontradas`)

    if (quickResult.quickDetections.length === 0) {
        const qualityOk = quickResult.meta.qualityScore >= 45 && quickResult.meta.quality !== 'Inadequada'

        if (qualityOk) {
            try {
                console.log('Estágio 1 vazio com qualidade aceitável — tentando laudo único (revisão).')
                const single = await callVisionAI(imageData, clinicalContext, models, prompts)
                warnings.push('Estágio 1 não retornou caixas delimitadoras; laudo em uma etapa foi usado para revisão.')
                return { analysis: single, warnings }
            } catch (e) {
                console.warn('Fallback laudo único após estágio 1 vazio falhou:', e)
                Sentry.captureException(e instanceof Error ? e : new Error(String(e)), {
                    tags: { vision_stage: 'single_pass_fallback' },
                    extra: { reason: 'stage1_empty' },
                })
                warnings.push('Não foi possível revisar com laudo único; mantendo resumo sem achados delimitados.')
            }
        }

        console.log('Nenhuma detecção no Estágio 1, gerando relatório básico...')
        return {
            analysis: {
                meta: quickResult.meta,
                detections: [],
                report: {
                    technicalAnalysis: 'Não foram identificadas anomalias radiográficas significativas na imagem analisada.',
                    detailedFindings: 'A imagem não apresenta alterações patológicas detectáveis.',
                    diagnosticHypothesis: 'Ausência de achados radiográficos significativos.',
                    recommendations: [
                        'Continuar com exames de rotina periódicos quando indicado clinicamente.',
                        'Correlacionar com quadro clínico.',
                    ],
                },
            },
            warnings,
        }
    }

    console.log('=== ESTÁGIO 2: Análise Detalhada ===')
    let detailedAnalysis: z.infer<typeof DetailedDetectionSchema>['detailedAnalysis'] = []
    try {
        const detailedResult = await callVisionDetailedAnalysis(imageData, quickResult.quickDetections, clinicalContext, models, prompts)
        detailedAnalysis = detailedResult.detailedAnalysis
        console.log(`Estágio 2 concluído: ${detailedAnalysis.length} análises detalhadas`)
    } catch (err) {
        console.warn('Estágio 2 falhou, usando apenas resultados do Estágio 1:', err)
        warnings.push('Análise detalhada (estágio 2) indisponível; exibindo resumo do estágio 1.')
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
            tags: { vision_stage: '2' },
            extra: { models: models.join(',') },
        })
    }

    let detections = quickResult.quickDetections.map((qd, index) => {
        const byIndex = detailedAnalysis.find((d) => d.originalIndex === index)
        const byLabel =
            !byIndex ? detailedAnalysis.find((d) => normalizeLabel(d.label ?? '') === normalizeLabel(qd.label)) : undefined
        const detailed = byIndex ?? byLabel

        return {
            id: `det-${index}`,
            label: qd.label,
            confidence: qd.confidence,
            box: qd.box,
            severity: qd.severity,
            anatomicalRegion: qd.anatomicalRegion ?? detailed?.anatomicalRegion,
            cidCode: detailed?.cidCode,
            differentialDiagnosis: detailed?.differentialDiagnosis,
            clinicalSignificance: detailed?.clinicalSignificance,
            recommendedActions: detailed?.recommendedActions,
            description: detailed?.description,
            detailedDescription: detailed?.detailedDescription,
        }
    })

    console.log('=== VALIDAÇÃO: Verificando bounding boxes ===')
    detections = validateAndMergeDetections(detections) as typeof detections
    console.log(`Validação concluída: ${detections.length} detecções após validação`)

    const perToothBreakdown = Object.entries(
        detections.reduce(
            (acc, det) => {
                const region = det.anatomicalRegion || 'Região não identificada'
                if (!acc[region]) acc[region] = []
                acc[region].push(det)
                return acc
            },
            {} as Record<string, typeof detections>,
        ),
    ).map(([region, dets]) => ({
        tooth: region,
        findings: dets.map((d) => d.label).join(', '),
        cidCode: dets.find((d) => d.cidCode)?.cidCode,
        severity: dets.some((d) => d.severity === 'critical')
            ? ('critical' as const)
            : dets.some((d) => d.severity === 'moderate')
              ? ('moderate' as const)
              : ('normal' as const),
    }))

    const recommendations = [...new Set(detections.flatMap((d) => d.recommendedActions || []))]
    const differentialDiagnosis = detections
        .flatMap((d) => d.differentialDiagnosis || [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5)

    const report = {
        technicalAnalysis: `Análise técnica da imagem radiográfica ${quickResult.meta.imageType.toLowerCase()} de qualidade ${quickResult.meta.quality.toLowerCase()}.`,
        detailedFindings: detections
            .map((d) => `- ${d.label}${d.anatomicalRegion ? ` (${d.anatomicalRegion})` : ''}: ${d.detailedDescription || d.description || ''}`)
            .join('\n'),
        diagnosticHypothesis: `Baseado nas ${detections.length} anomalias detectadas, sugere-se investigação clínica das condições identificadas.`,
        recommendations: recommendations.length > 0 ? recommendations : ['Avaliação clínica recomendada.'],
        perToothBreakdown,
        differentialDiagnosis: differentialDiagnosis.length > 0 ? differentialDiagnosis.join('; ') : undefined,
    }

    const cleanDetections = detections.map((d) => {
        const { id: _id, _warnings: _w, ...rest } = d as typeof d & { _warnings?: string[] }
        return rest
    })

    return {
        analysis: {
            meta: quickResult.meta,
            detections: cleanDetections,
            report,
        } satisfies VisionAnalysis,
        warnings,
    }
}

export function mapAnalysisToResponse(
    analysis: VisionAnalysis,
    options?: { pipelineWarnings?: string[] },
) {
    const qualityScore = analysis.meta.qualityScore
    const avgDetectionConfidence =
        analysis.detections.length > 0
            ? analysis.detections.reduce((sum, d) => sum + (d.confidence ?? 0.8), 0) / analysis.detections.length
            : 0.8
    const overallPrecision = Math.round(qualityScore * 0.4 + avgDetectionConfidence * 100 * 0.6)

    const detections = analysis.detections.map((d, i) => ({
        id: `det-${i}`,
        label: d.label,
        confidence: d.confidence ?? 0.85,
        box: {
            ymin: d.box[0],
            xmin: d.box[1],
            ymax: d.box[2],
            xmax: d.box[3],
        },
        severity: d.severity,
        description: d.description,
        detailedDescription: d.detailedDescription,
        anatomicalRegion: d.anatomicalRegion,
        cidCode: d.cidCode,
        differentialDiagnosis: d.differentialDiagnosis,
        clinicalSignificance: d.clinicalSignificance,
        recommendedActions: d.recommendedActions,
    }))

    let findings = analysis.detections.map((d) => ({
        type: d.label,
        zone: d.description ? d.description.slice(0, 50) : d.anatomicalRegion ? d.anatomicalRegion : 'Região Identificada',
        level: d.severity === 'critical' ? 'Crítico' : d.severity === 'moderate' ? 'Moderado' : 'Normal',
        color: d.severity === 'critical' ? 'text-red-500' : d.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500',
        confidence: d.confidence ?? 0.85,
    }))

    const extractFromLaudo = process.env.MEDVISION_EXTRACT_FINDINGS_FROM_REPORT === 'true'

    if (findings.length === 0 && analysis.report.detailedFindings && extractFromLaudo) {
        const findingsText = analysis.report.detailedFindings
        const extractedFindings: typeof findings = []
        for (const kw of LAUDO_KEYWORDS) {
            if (kw.pattern.test(findingsText)) {
                extractedFindings.push({
                    type: kw.type,
                    zone: 'Identificado no laudo',
                    level: kw.severity === 'critical' ? 'Crítico' : kw.severity === 'moderate' ? 'Moderado' : 'Normal',
                    color: kw.severity === 'critical' ? 'text-red-500' : kw.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500',
                    confidence: avgDetectionConfidence,
                })
            }
        }
        if (extractedFindings.length > 0) findings = extractedFindings
    }

    const pipelineWarnings = options?.pipelineWarnings?.filter((w) => w.length > 0) ?? []

    return {
        meta: analysis.meta,
        detections,
        report: analysis.report,
        findings,
        precision: overallPrecision,
        ...(pipelineWarnings.length > 0 ? { warnings: pipelineWarnings } : {}),
    }
}
