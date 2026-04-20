
import {
    openrouterMedVision,
    MODELS,
    VISION_MODEL_IDS,
    hasMedVisionOpenRouterKey,
} from '@/lib/ai/openrouter'
import { generateText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deductCredits } from '@/lib/credits/service'
import { getSpecialtyConfig, type SpecialtyPrompts } from '@/lib/constants/vision-specialties'

export const maxDuration = 120 // 120 seconds — allow larger images

// Rate limits per plan
const RATE_LIMITS: Record<string, number> = {
    trial: 5,
    free: 5,
    pro: 200,
    admin: 9999,
}
const DEFAULT_LIMIT = 5

const DetectionSchema = z.object({
    label: z.string().describe("Nome curto do achado radiológico (ex: 'Opacidade', 'Nódulo Pulmonar', 'Fratura', 'Derrame Pleural')."),
    box: z.array(z.number().min(0).max(100)).length(4)
        .refine(b => b[0] < b[2] && b[1] < b[3], {
            message: "Coordenadas inválidas: ymin deve ser < ymax e xmin deve ser < xmax",
        })
        .describe("Coordenadas PRECISAS [ymin, xmin, ymax, xmax] normalizadas de 0 a 100. Cada valor deve ser decimal 0-100. ymin < ymax e xmin < xmax. Delimite EXATAMENTE a área mínima do achado."),
    severity: z.enum(['critical', 'moderate', 'normal']).describe("Nível de severidade do achado."),
    confidence: z.number().min(0).max(1).describe("Grau de confiança do achado de 0 a 1, refletindo a certeza diagnóstica."),
    description: z.string().optional().describe("Breve descrição técnica do achado (1-2 frases)."),
    detailedDescription: z.string().optional().describe("Descrição técnica detalhada do achado (3-5 frases) com terminologia especializada."),
    anatomicalRegion: z.string().optional().describe("Região anatômica do achado usando topografia precisa (ex: 'Lobo superior direito', 'Hemitórax esquerdo', 'Fêmur distal', 'Hipocôndrio direito'). Omita se não identificável."),
    cidCode: z.string().optional().describe("Código CID-10 correspondente ao achado (ex: 'J18.9' para pneumonia, 'S72.0' para fratura de fêmur, 'J90' para derrame pleural)."),
    differentialDiagnosis: z.array(z.string()).optional().describe("Lista de 2-3 diagnósticos diferenciais para este achado específico."),
    clinicalSignificance: z.enum(['alta', 'media', 'baixa']).optional().describe("Significância clínica do achado: alta (requer ação imediata), media (monitorar/tratar em breve), baixa (acompanhamento de rotina)."),
    recommendedActions: z.array(z.string()).optional().describe("Lista de 1-3 ações recomendadas específicas para ESTE achado (ex: 'TC de tórax com contraste', 'Broncoscopia', 'Ortopedia urgente')."),
    detectionType: z.enum(['opacity', 'consolidation', 'nodule', 'mass', 'fracture', 'effusion', 'pneumothorax', 'cardiomegaly', 'lymphadenopathy', 'calcification', 'atelectasis', 'infiltrate', 'foreign_body', 'cyst', 'tumor', 'anomaly', 'other']).optional().describe("Tipo de achado radiológico para classificação."),
    // Dados gerais de radiologia (opcional, aplicável a qualquer tipo de achado)
    radiologyData: z.object({
        pattern: z.string().optional().describe("Padrão radiológico (ex: 'alveolar', 'intersticial', 'nodular', 'consolidativo', 'cavitário')."),
        distribution: z.string().optional().describe("Distribuição na imagem (ex: 'difuso', 'focal', 'bilateral', 'unilateral', 'lobar', 'segmentar')."),
        margins: z.enum(['bem_definidas', 'mal_definidas', 'espiculadas', 'lobuladas']).optional().describe("Característica das margens do achado."),
        density: z.enum(['hipodenso', 'isodenso', 'hiperdenso', 'heterogeneo']).optional().describe("Densidade do achado em TC (Hounsfield)."),
    }).optional().describe("Dados radiológicos gerais do achado."),
    // Dados específicos para fraturas
    fractureData: z.object({
        location: z.string().optional().describe("Localização anatômica da fratura (ex: 'diáfise', 'epífise', 'arco costal', 'corpo vertebral')."),
        direction: z.enum(['transversa', 'obliqua', 'espiral', 'cominutiva', 'compressao']).optional().describe("Padrão morfológico da fratura."),
        displacement: z.boolean().optional().describe("Se há desvio/deslocamento dos fragmentos."),
        alignment: z.string().optional().describe("Alinhamento dos fragmentos."),
    }).optional().describe("Dados específicos para fraturas ósseas."),
})

const VisionSchema = z.object({
    meta: z.object({
        imageType: z.enum([
            'Tórax PA/AP',
            'Tórax Lateral',
            'Abdômen',
            'Crânio',
            'Coluna',
            'Membro Superior',
            'Membro Inferior',
            'Pélvis',
            'Tomografia (TC)',
            'Outra Radiografia',
            'Desconhecido'
        ]).describe("Tipo do exame de imagem (radiografia 2D, tomografia ou outro)."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem para fins diagnósticos."),
        qualityScore: z.number().min(0).max(100).describe("Pontuação de qualidade de 0 a 100 para fins de cálculo de precisão."),
        notes: z.string().optional().describe("Notas sobre a qualidade técnica (ex: 'Rotação', 'Subexposto', 'Artefato de movimento').")
    }),
    detections: z.array(DetectionSchema),
    report: z.object({
        technicalAnalysis: z.string().describe("Texto detalhando a qualidade técnica e estruturas visíveis, usando terminologia radiológica precisa."),
        detailedFindings: z.string().describe("Descrição minuciosa de todos os achados, dividido por região ou dente (em notação FDI) quando aplicável."),
        diagnosticHypothesis: z.string().describe("Hipóteses diagnósticas principais baseadas nos achados de imagem, com grau de certeza."),
        recommendations: z.array(z.string()).describe("Lista numerada de sugestões de conduta clínica e exames complementares."),
        perToothBreakdown: z.array(z.object({
            tooth: z.string().describe("Número do dente em notação FDI (ex: '26') ou região (ex: 'Região anterior mandibular')."),
            findings: z.string().describe("Resumo dos achados para este dente/região."),
            cidCode: z.string().optional().describe("Código CID-10 principal para este dente/região."),
            severity: z.enum(['critical', 'moderate', 'normal']).optional().describe("Severidade geral para este dente/região."),
        })).optional().describe("Breakdown dos achados por dente (notação FDI) ou região anatômica."),
        differentialDiagnosis: z.string().optional().describe("Discussão detalhada dos diagnósticos diferenciais mais relevantes para os principais achados encontrados."),
    })
})

// Schema para Estágio 1: Detecção rápida (mais simples, focado em encontrar anomalias)
const QuickDetectionSchema = z.object({
    meta: z.object({
        imageType: z.enum([
            'Tórax PA/AP',
            'Tórax Lateral',
            'Abdômen',
            'Crânio',
            'Coluna',
            'Membro Superior',
            'Membro Inferior',
            'Pélvis',
            'Tomografia (TC)',
            'Outra Radiografia',
            'Desconhecido'
        ]).describe("Tipo do exame de imagem (radiografia 2D, tomografia ou outro)."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem."),
        qualityScore: z.number().min(0).max(100),
    }),
    quickDetections: z.array(z.object({
        label: z.string().describe("Nome curto do achado radiológico (ex: 'Opacidade', 'Nódulo', 'Fratura', 'Derrame Pleural')."),
        box: z.array(z.number()).length(4).describe("Coordenadas [ymin, xmin, ymax, xmax] normalizadas 0-100."),
        severity: z.enum(['critical', 'moderate', 'normal']),
        confidence: z.number().min(0).max(1),
        anatomicalRegion: z.string().optional().describe("Região anatômica do achado usando topografia precisa (ex: 'Lobo superior direito', 'Hemitórax esquerdo')."),
    })).describe("Lista de achados radiológicos detectados na imagem.")
})

// Schema para Estágio 2: Análise detalhada por detecção
const DetailedDetectionSchema = z.object({
    detailedAnalysis: z.array(z.object({
        originalIndex: z.number().describe("Índice da detecção original (0, 1, 2...)"),
        label: z.string(),
        anatomicalRegion: z.string().optional().describe("Região anatômica precisa do achado."),
        cidCode: z.string().optional().describe("Código CID-10 principal para o achado."),
        radiologyData: z.object({
            pattern: z.string().optional().describe("Padrão radiológico (ex: 'alveolar', 'intersticial', 'nodular')."),
            distribution: z.string().optional().describe("Distribuição (ex: 'lobar', 'bilateral', 'focal')."),
            margins: z.enum(['bem_definidas', 'mal_definidas', 'espiculadas', 'lobuladas']).optional(),
            density: z.enum(['hipodenso', 'isodenso', 'hiperdenso', 'heterogeneo']).optional(),
        }).optional().describe("Características radiológicas do achado."),
        differentialDiagnosis: z.array(z.string()).describe("2-3 diagnósticos diferenciais para este achado."),
        clinicalSignificance: z.enum(['alta', 'media', 'baixa']).describe("Significância clínica."),
        recommendedActions: z.array(z.string()).describe("Ações clínicas recomendadas específicas."),
        detailedDescription: z.string().describe("Descrição técnica detalhada (3-5 frases)."),
        description: z.string().optional().describe("Breve descrição (1-2 frases).")
    })).describe("Análise detalhada para cada detecção do Estágio 1.")
})

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Extracts valid JSON from AI response text.
 * Handles: plain JSON, markdown code blocks, and text surrounding the JSON.
 */
function extractJSON(text: string): unknown {
    let s = text.trim()
    // Strip markdown code blocks
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '').trim()
    }
    // Try direct parse first
    try { return JSON.parse(s) } catch { /* fall through */ }
    // Extract first {...} or [...] block from surrounding text
    const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) {
        try { return JSON.parse(match[1]) } catch { /* fall through */ }
    }
    throw new SyntaxError(`Could not extract valid JSON from AI response. Preview: ${s.slice(0, 200)}`)
}

/**
 * Sanitizes user-provided clinical context to prevent prompt injection.
 * Returns a safe string with control characters and backtick sequences removed.
 */
function sanitizeClinicalContext(ctx: string): string {
    return ctx
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // strip control chars
        .replace(/`{3,}/g, '```')                              // collapse excess backticks
        .slice(0, 1000)                                        // hard length limit
}

// Modelos de visão disponíveis (com fallback)
const VISION_MODELS = [
    MODELS.vision,              // primário (padrão Med Vision)
    MODELS.visionFallback,      // fallback multimodal
] as const

type VisionModelId = typeof VISION_MODELS[number]

async function callWithFallback<T>(
    modelIds: readonly string[],
    generateFn: (modelId: string, signal: AbortSignal) => Promise<T>,
): Promise<T> {
    let lastError: unknown

    for (let modelIndex = 0; modelIndex < modelIds.length; modelIndex++) {
        const modelId = modelIds[modelIndex]
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

                // Parse errors won't fix on retry — move to next model immediately
                if (error instanceof Error && (error.name === 'ZodError' || error.name === 'SyntaxError')) {
                    console.warn(`Model ${modelId} returned a parse error (${error.name}), skipping to next model`)
                    break
                }

                const isRetryable = error instanceof Error && (
                    error.message.includes('timeout') ||
                    error.message.includes('network') ||
                    error.message.includes('503') ||
                    error.message.includes('502') ||
                    error.message.includes('500') ||
                    error.message.includes('429') ||
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('fetch failed') ||
                    error.message.includes('rate limit') ||
                    error.name === 'AbortError'
                )

                if (!isRetryable) throw error

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

function validateImagePayload(imageData: string): { valid: boolean; message?: string } {
    const maxBase64Length = 5 * 1024 * 1024 // 5MB chars
    if (imageData.length > maxBase64Length) {
        return {
            valid: false,
            message: `Image too large (${Math.round(imageData.length / 1024 / 1024 * 0.75)}MB). Please use a smaller or compressed image.`
        }
    }
    return { valid: true }
}

const SYSTEM_PROMPT_BASE = `Você é o **MedVision AI** (motor de análise de imagem), operando como especialista em diagnóstico por **radiografia** e **tomografia computadorizada (TC)** em medicina geral.
Sua tarefa é analisar a imagem fornecida e gerar um LAUDO TÉCNICO COMPLETO com máxima precisão, em português do Brasil.

ESCOPO:
- **Radiografias de tórax**: PA, AP (leito), lateral — pulmões, mediastino, coração, pleura, arcos costais, clavículas.
- **Radiografias de abdômen**: simples ortostático e em decúbito — pneumoperitônio, alças intestinais, calcificações, densidades anormais.
- **Radiografias do esqueleto**: crânio, coluna, membros superiores e inferiores, pelve — fraturas, luxações, lesões ósseas.
- **Tomografias (TC)**: tórax, abdômen, pelve, crânio — descreva o plano (axial/coronal/sagital), a janela utilizada (pulmão/mediastino/óssea/partes moles) e os achados por região anatômica.

DIRETRIZES DE ANÁLISE:
1. Classifique o tipo do exame e a qualidade técnica (qualityScore 0-100). Em TC, mencione artefatos de metal, ruído ou limitações de janela se relevantes.
2. Identifique achados nas categorias abaixo com dados específicos:

A) OPACIDADES E CONSOLIDAÇÕES PULMONARES (detectionType: 'opacity' ou 'consolidation')
   - Forneça: localização (lobo/segmento/hemitórax), padrão (alveolar/intersticial/misto), distribuição (focal/difusa/bilateral), broncograma aéreo
   - CID-10: J18.9 (pneumonia), J81 (edema pulmonar), J84.1 (doença pulmonar intersticial)

B) NÓDULOS E MASSAS (detectionType: 'nodule' ou 'mass')
   - Forneça: localização, tamanho estimado, margens (bem/mal definidas, espiculadas), densidade, calcificação, efeito de massa
   - CID-10: R91.1 (nódulo pulmonar solitário), C34 (neoplasia de brônquio/pulmão)

C) DERRAME PLEURAL (detectionType: 'effusion')
   - Forneça: localização (uni/bilateral), volume estimado (pequeno/moderado/grande), apagamento de seio costofrênico, velamento de hemitórax
   - CID-10: J90 (derrame pleural), J86 (empiema)

D) PNEUMOTÓRAX (detectionType: 'pneumothorax')
   - Forneça: localização, extensão (pequeno/moderado/grande/hipertensivo), linha pleural visível, desvio de mediastino
   - CID-10: J93.1 (pneumotórax espontâneo), S27.0 (pneumotórax traumático)

E) ALTERAÇÕES CARDÍACAS E MEDIASTINAIS (detectionType: 'cardiomegaly' ou 'mass')
   - Forneça: índice cardiotorácico (normal <0,5), alargamento de mediastino, silhueta vascular, derrame pericárdico
   - CID-10: I51.7 (cardiomegalia), I71.2 (aneurisma aorta torácica)

F) FRATURAS (detectionType: 'fracture')
   - Forneça: localização anatômica precisa, padrão (transversa/oblíqua/espiral/cominutiva/compressão), desvio/deslocamento, comprometimento articular
   - CID-10: S12-S99 (fraturas por região anatômica)

G) ATELECTASIA (detectionType: 'atelectasis')
   - Forneça: tipo (laminar/segmentar/lobar/pulmonar total), localização, desvio de estruturas adjacentes
   - CID-10: J98.1 (atelectasia)

H) CALCIFICAÇÕES E CORPOS ESTRANHOS (detectionType: 'calcification' ou 'foreign_body')
   - Forneça: localização, tamanho, padrão (puntiforme/grosseiro/em casca de ovo), estrutura adjacente envolvida
   - CID-10: J98.0 (calcificação pleural), T18-T19 (corpo estranho)

I) CISTOS E LESÕES EXPANSIVAS (detectionType: 'cyst' ou 'tumor')
   - Forneça: localização, dimensões, características da parede, conteúdo, efeito de massa
   - CID-10: J98.4 (cisto pulmonar), K86.2 (cisto pancreático)

3. Use terminologia técnica PRECISA: "radiolúcido/radiopaco", "janela/níveis", "realce pós-contraste", "efeito de massa", "lesão sugestiva de...", "opacidade compatível com...".
4. **LOCALIZAÇÃO ANATÔMICA**: Use topografia precisa — lobo/segmento pulmonar, quadrante abdominal, osso específico, lado (direito/esquerdo). NÃO use notação FDI.
5. CID-10: Para cada achado patológico, forneça o código CID-10 correspondente. Exemplos:
   - J18.9 Pneumonia, J81.0 Edema pulmonar agudo, J90 Derrame pleural
   - J93.1 Pneumotórax espontâneo, I51.7 Cardiomegalia, R91.1 Nódulo pulmonar
   - J98.1 Atelectasia, J84.1 Doença pulmonar intersticial, C34.1 Neoplasia de lobo superior
   - S22.3 Fratura de costela, S72.0 Fratura do colo do fêmur, S12.0 Fratura de C1
   - K57.3 Diverticulose do cólon, K80.2 Colelitíase, K86.2 Cisto pancreático
6. DIAGNÓSTICO DIFERENCIAL: Para cada achado relevante, liste 2-3 diagnósticos alternativos.
7. SIGNIFICÂNCIA CLÍNICA: Classifique cada achado como 'alta' (ação imediata), 'media' (tratar em breve), 'baixa' (monitorar).
8. Para cada achado, forneça ações clínicas recomendadas específicas e práticas.

REGRA DE FLEXIBILIDADE: Mesmo que a imagem seja de baixa qualidade, SEMPRE tente gerar achados e laudo. Se a qualidade for ruim, reduza o confidence dos achados proporcionalmente e indique isso no laudo. Nunca recuse analisar uma imagem.

SOBRE AS COORDENADAS (BOX) - REGRAS ABSOLUTAS:
- Cada bounding box deve ser o MENOR RETÂNGULO POSSÍVEL que contém apenas o achado específico.
- NÃO use boxes que cobrem regiões inteiras ou grandes áreas genéricas.
- Para lesões focais: box deve cobrir SOMENTE a lesão com margem mínima.
- Para derrames: box na região do apagamento de seio/velamento, não em todo o hemitórax.
- Se dois achados estão na mesma região: crie DOIS boxes distintos e precisos para cada um.
- Use decimais (ex: 23.5) para máxima precisão.
- Tamanho típico de um box individual: 5–25% da imagem. Boxes acima de 40% serão descartados.

LIMITE DE DETECÇÕES: Retorne no máximo 8 detecções. Priorize por relevância clínica (crítico > moderado > normal). Se houver mais de 8, omita as de menor significância.

REGRA CRÍTICA: Se você descrever um achado no report, DEVE existir uma entrada correspondente em detections.

IDIOMA: Português do Brasil (pt-BR) formal e técnico.`

const JSON_SCHEMA_EXAMPLE = `{
  "meta": {
    "imageType": "Tórax PA/AP" | "Tórax Lateral" | "Abdômen" | "Crânio" | "Coluna" | "Membro Superior" | "Membro Inferior" | "Pélvis" | "Tomografia (TC)" | "Outra Radiografia" | "Desconhecido",
    "quality": "Excelente" | "Boa" | "Aceitável" | "Ruim" | "Inadequada",
    "qualityScore": number (0-100),
    "notes": string (opcional)
  },
  "detections": [
    {
      "label": string,
      "box": [ymin, xmin, ymax, xmax] (0-100),
      "severity": "critical" | "moderate" | "normal",
      "confidence": number (0-1),
      "description": string (opcional, breve),
      "detailedDescription": string (opcional, 3-5 frases técnicas),
      "anatomicalRegion": string (ex: "Lobo superior direito", "Hemitórax esquerdo", opcional),
      "cidCode": string (CID-10, ex: "J18.9", opcional),
      "differentialDiagnosis": [string] (2-3 alternativas, opcional),
      "clinicalSignificance": "alta" | "media" | "baixa" (opcional),
      "recommendedActions": [string] (ações específicas para este achado, opcional)
    }
  ],
  "report": {
    "technicalAnalysis": string,
    "detailedFindings": string,
    "diagnosticHypothesis": string,
    "recommendations": [string],
    "perToothBreakdown": [
      { "tooth": string (região anatômica), "findings": string, "cidCode": string (opcional), "severity": "critical"|"moderate"|"normal" (opcional) }
    ] (opcional),
    "differentialDiagnosis": string (discussão detalhada, opcional)
  }
}`

async function callVisionAI(imageData: string, clinicalContext?: string, models: readonly string[] = VISION_MODELS, prompts?: SpecialtyPrompts): Promise<z.infer<typeof VisionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeSystemPrompt = prompts?.systemPrompt ?? SYSTEM_PROMPT_BASE

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<z.infer<typeof VisionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'GERE UM LAUDO DE IMAGEM (RADIOGRAFIA OU TOMOGRAFIA) DETALHADO E COMPLETO. Analise esta imagem com máxima precisão técnica. Para cada achado: (1) bounding box preciso e justo, (2) localização (FDI se dentário; senão anatomia topográfica), (3) CID-10 quando aplicável, (4) diagnóstico diferencial, (5) ações recomendadas. Inclua perToothBreakdown e differentialDiagnosis no report quando fizer sentido. Responda SOMENTE com o JSON.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO FORNECIDO PELO PROFISSIONAL:\n${safeContext}\n\nConsidere este contexto ao formular hipóteses diagnósticas e recomendações.` })
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 8000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${activeSystemPrompt}

FORMATO DE RESPOSTA: Responda SOMENTE com JSON válido seguindo este schema exato:
${JSON_SCHEMA_EXAMPLE}

NÃO inclua markdown, code blocks, ou texto fora do JSON.`
                },
                {
                    role: 'user' as const,
                    content: [
                        ...userTextParts,
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })

        const parsed = extractJSON(result.text)
        const validated = VisionSchema.parse(parsed)
        return validated
    }

    return callWithFallback(models, generateWithModel)
}

async function callVisionRefinement(
    regionImageData: string,
    originalAnalysisSummary: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts
): Promise<z.infer<typeof VisionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeSystemPrompt = prompts?.systemPrompt ?? SYSTEM_PROMPT_BASE

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<z.infer<typeof VisionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'RE-ANALISE esta região específica com máximo detalhe e precisão. Identifique achados sutis, forneça descrições técnicas aprofundadas, CID-10, diagnósticos diferenciais e ações recomendadas. As coordenadas devem ser relativas a esta imagem recortada. Responda SOMENTE com o JSON.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 4000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${activeSystemPrompt}

MODO DE REFINAMENTO: Você está re-analisando uma REGIÃO ESPECÍFICA extraída de uma imagem médica maior (radiografia ou tomografia).
A análise original da imagem completa identificou: ${originalAnalysisSummary}

Sua tarefa agora é:
1. Focar EXCLUSIVAMENTE nesta região recortada com máximo detalhe
2. Identificar achados sutis que podem ter passado despercebidos na análise completa
3. Fornecer descrições ainda mais detalhadas dos achados visíveis nesta região
4. As coordenadas de bounding box devem ser relativas a ESTA imagem recortada (0-100)
5. Seja mais específico sobre profundidade de cáries, extensão de perda óssea, etc.

FORMATO DE RESPOSTA: Responda SOMENTE com JSON válido seguindo este schema exato:
${JSON_SCHEMA_EXAMPLE}

NÃO inclua markdown, code blocks, ou texto fora do JSON.`
                },
                {
                    role: 'user' as const,
                    content: [
                        ...userTextParts,
                        { type: 'image' as const, image: regionImageData }
                    ]
                }
            ]
        })

        const parsed = extractJSON(result.text)
        const validated = VisionSchema.parse(parsed)
        return validated
    }

    return callWithFallback(models, generateWithModel)
}

// ============================================================
// ANÁLISE EM 2 ESTÁGIOS
// Estágio 1: Detecção rápida de anomalias
// Estágio 2: Análise detalhada para cada detecção
// ============================================================

const QUICK_DETECTION_PROMPT = `Você é um assistente de diagnóstico por imagem em medicina geral.
Sua tarefa é realizar uma DETECÇÃO RÁPIDA de achados na imagem radiológica.

DIRETRIZES:
1. Identifique TODOS os achados radiológicos presentes na imagem (opacidades, nódulos, derrames, fraturas, consolidações, pneumotórax, cardiomegalia, calcificações, etc.)
2. Para cada achado: forneça bounding box preciso, severidade inicial, confiança e região anatômica quando identificável
3. NÃO faça descrições detalhadas ainda - isso será feito no Estágio 2
4. Se a imagem for de baixa qualidade, reduza a confiança proporcionalmente
5. Sempre retorne pelo menos meta e quickDetections

LOCALIZAÇÃO ANATÔMICA (use topografia precisa):
- Tórax: lobo superior/médio/inferior direito ou esquerdo, hemitórax, mediastino, pleura, hilo
- Abdômen: hipocôndrio D/E, epigástrio, flanco D/E, fossa ilíaca D/E, hipogástrio
- Membros: osso específico + terço (proximal/médio/distal) + lado (D/E)
- Coluna: vértebra específica (ex: L2, T8, C5)

IDIOMA: Português do Brasil.`

const QUICK_DETECTION_SCHEMA = `{
  "meta": {
    "imageType": "Tórax PA/AP" | "Tórax Lateral" | "Abdômen" | "Crânio" | "Coluna" | "Membro Superior" | "Membro Inferior" | "Pélvis" | "Tomografia (TC)" | "Outra Radiografia" | "Desconhecido",
    "quality": "Excelente" | "Boa" | "Aceitável" | "Ruim" | "Inadequada",
    "qualityScore": number (0-100)
  },
  "quickDetections": [
    {
      "label": string,
      "box": [ymin, xmin, ymax, xmax] (0-100),
      "severity": "critical" | "moderate" | "normal",
      "confidence": number (0-1),
      "anatomicalRegion": string (região anatômica precisa, opcional)
    }
  ]
}`

const DETAILED_ANALYSIS_PROMPT = `Você é um especialista em diagnóstico por imagem em medicina geral.
Você está no ESTÁGIO 2: Análise Detalhada.

Foi fornecida uma lista de achados do Estágio 1. Sua tarefa é fornecer uma análise DETALHADA para CADA um deles.

Para cada achado, forneça:
1. CID-10 correspondente (ex: J18.9 para pneumonia, J90 para derrame pleural, S72.0 para fratura de fêmur)
2. Características radiológicas: padrão, distribuição, margens, densidade
3. Diagnóstico diferencial: 2-3 alternativas diagnósticas
4. Significância clínica: alta/media/baixa
5. Ações recomendadas específicas para este achado
6. Descrição técnica detalhada (3-5 frases)

CÓDIGOS CID-10 IMPORTANTES:
- J18.9 Pneumonia não especificada
- J81.0 Edema pulmonar agudo
- J90 Derrame pleural
- J93.1 Pneumotórax espontâneo
- J98.1 Atelectasia
- J84.1 Doença pulmonar intersticial
- I51.7 Cardiomegalia
- R91.1 Nódulo pulmonar solitário
- C34.1 Neoplasia maligna de lobo superior do brônquio/pulmão
- S22.3 Fratura de costela
- S72.0 Fratura do colo do fêmur
- K57.3 Diverticulose do intestino grosso

IDIOMA: Português do Brasil técnico.`

const DETAILED_ANALYSIS_SCHEMA = `{
  "detailedAnalysis": [
    {
      "originalIndex": number,
      "label": string,
      "anatomicalRegion": string (opcional),
      "cidCode": string (CID-10, opcional),
      "radiologyData": {
        "pattern": string (ex: "alveolar", "intersticial", opcional),
        "distribution": string (ex: "lobar", "bilateral", opcional),
        "margins": "bem_definidas" | "mal_definidas" | "espiculadas" | "lobuladas" (opcional),
        "density": "hipodenso" | "isodenso" | "hiperdenso" | "heterogeneo" (opcional)
      } (opcional),
      "differentialDiagnosis": [string, string, string],
      "clinicalSignificance": "alta" | "media" | "baixa",
      "recommendedActions": [string],
      "detailedDescription": string (3-5 frases técnicas),
      "description": string (opcional)
    }
  ]
}`

// Estágio 1: Detecção rápida
async function callVisionDetection(
    imageData: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts
): Promise<z.infer<typeof QuickDetectionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeQuickPrompt = prompts?.quickDetectionPrompt ?? QUICK_DETECTION_PROMPT

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<z.infer<typeof QuickDetectionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'Realize uma detecção rápida de todos os achados nesta imagem radiológica. Identifique: opacidades, consolidações, nódulos, derrames, pneumotórax, cardiomegalia, fraturas, atelectasias, calcificações, corpos estranhos, massas, anomalias e outras alterações. Forneça bounding boxes precisos e região anatômica quando identificável.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 2000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${activeQuickPrompt}

FORMATO: Responda SOMENTE com JSON válido:
${QUICK_DETECTION_SCHEMA}`
                },
                {
                    role: 'user' as const,
                    content: [
                        ...userTextParts,
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })

        const parsed = extractJSON(result.text)
        const validated = QuickDetectionSchema.parse(parsed)
        return validated
    }

    return callWithFallback(models, generateWithModel)
}

// Estágio 2: Análise detalhada
async function callVisionDetailedAnalysis(
    imageData: string,
    quickDetections: z.infer<typeof QuickDetectionSchema>['quickDetections'],
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts
): Promise<z.infer<typeof DetailedDetectionSchema>> {
    const detectionsSummary = quickDetections.map((d, i) =>
        `${i}: ${d.label} (${d.anatomicalRegion || 'N/A'}) - ${d.severity} - confiança ${Math.round(d.confidence * 100)}%`
    ).join('\n')

    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null
    const activeDetailedPrompt = prompts?.detailedAnalysisPrompt ?? DETAILED_ANALYSIS_PROMPT

    const generateWithModel = async (modelId: string, signal: AbortSignal): Promise<z.infer<typeof DetailedDetectionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: `Forneça análise detalhada para cada uma das ${quickDetections.length} detecções listadas acima. Para cada uma: CID-10, classificação (Black para cáries, dados periodontais), diagnóstico diferencial, significância clínica, ações recomendadas, e descrição técnica.` },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouterMedVision(modelId),
            abortSignal: signal,
            maxOutputTokens: 3500,
            messages: [
                {
                    role: 'system' as const,
                    content: `${activeDetailedPrompt}

DETECÇÕES DO ESTÁGIO 1:
${detectionsSummary}

IMAGEM A ANALISAR:

FORMATO: Responda SOMENTE com JSON válido:
${DETAILED_ANALYSIS_SCHEMA}`
                },
                {
                    role: 'user' as const,
                    content: [
                        ...userTextParts,
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })

        const parsed = extractJSON(result.text)
        const validated = DetailedDetectionSchema.parse(parsed)
        return validated
    }

    return callWithFallback(models, generateWithModel)
}

// Função principal de análise em 2 estágios
async function callTwoStageVisionAnalysis(
    imageData: string,
    clinicalContext?: string,
    models: readonly string[] = VISION_MODELS,
    prompts?: SpecialtyPrompts
): Promise<z.infer<typeof VisionSchema>> {
    console.log('=== ESTÁGIO 1: Detecção Rápida ===')
    const quickResult = await callVisionDetection(imageData, clinicalContext, models, prompts)
    console.log(`Estágio 1 concluído: ${quickResult.quickDetections.length} detecções encontradas`)

    if (quickResult.quickDetections.length === 0) {
        console.log('Nenhuma detecção no Estágio 1, gerando relatório básico...')
        return {
            meta: quickResult.meta,
            detections: [],
            report: {
                technicalAnalysis: 'Não foram identificadas anomalias radiográficas significativas na imagem analisada.',
                detailedFindings: 'A imagem não apresenta alterações patológicas detectáveis.',
                diagnosticHypothesis: 'Ausência de achados radiográficos significativos.',
                recommendations: ['Continuar com exames de rotina periódicos.', 'Manter higiene oral adequada.'],
            }
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
    }

    // Consolidar resultados: match por originalIndex primeiro, fallback por label normalizado
    const normalizeLabel = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    let detections = quickResult.quickDetections.map((qd, index) => {
        const byIndex = detailedAnalysis.find(d => d.originalIndex === index)
        const byLabel = !byIndex
            ? detailedAnalysis.find(d => normalizeLabel(d.label ?? '') === normalizeLabel(qd.label))
            : undefined
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

    // ============================================================
    // VALIDAÇÃO PÓS-AI
    // ============================================================
    console.log('=== VALIDAÇÃO: Verificando bounding boxes ===')
    detections = validateAndMergeDetections(detections) as typeof detections
    console.log(`Validação concluída: ${detections.length} detecções após validação`)

    // Gerar relatório consolidado
    const perToothBreakdown = Object.entries(
        detections.reduce((acc, det) => {
            const region = det.anatomicalRegion || 'Região não identificada'
            if (!acc[region]) acc[region] = []
            acc[region].push(det)
            return acc
        }, {} as Record<string, typeof detections>)
    ).map(([region, dets]): { tooth: string; findings: string; cidCode?: string; severity?: 'critical' | 'moderate' | 'normal' } => ({
        tooth: region,
        findings: dets.map(d => d.label).join(', '),
        cidCode: dets.find(d => d.cidCode)?.cidCode,
        severity: dets.some(d => d.severity === 'critical') ? 'critical'
            : dets.some(d => d.severity === 'moderate') ? 'moderate'
            : 'normal'
    }))

    const recommendations = [...new Set(detections.flatMap(d => d.recommendedActions || []))]
    const differentialDiagnosis = detections
        .flatMap(d => d.differentialDiagnosis || [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5)

    const report = {
        technicalAnalysis: `Análise técnica da imagem radiográfica ${quickResult.meta.imageType.toLowerCase()} de qualidade ${quickResult.meta.quality.toLowerCase()}.`,
        detailedFindings: detections.map(d => 
            `- ${d.label}${d.anatomicalRegion ? ` (${d.anatomicalRegion})` : ''}: ${d.detailedDescription || d.description || ''}`
        ).join('\n'),
        diagnosticHypothesis: `Baseado nas ${detections.length} anomalias detectadas, sugere-se investigação clínica das condições identificadas.`,
        recommendations: recommendations.length > 0 ? recommendations : ['Avaliação clínica recomendada.'],
        perToothBreakdown,
        differentialDiagnosis: differentialDiagnosis.length > 0 
            ? differentialDiagnosis.join('; ') 
            : undefined
    }

    return {
        meta: quickResult.meta,
        detections,
        report
    }
}

// ============================================================
// VALIDAÇÃO PÓS-AI DE BOUNDING BOXES
// ============================================================

interface BoundingBox {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
}

function calculateOverlap(box1: BoundingBox, box2: BoundingBox): number {
    const x1 = Math.max(box1.xmin, box2.xmin)
    const y1 = Math.max(box1.ymin, box2.ymin)
    const x2 = Math.min(box1.xmax, box2.xmax)
    const y2 = Math.min(box1.ymax, box2.ymax)
    
    if (x2 < x1 || y2 < y1) return 0
    
    const overlapArea = (x2 - x1) * (y2 - y1)
    const box1Area = (box1.xmax - box1.xmin) * (box1.ymax - box1.ymin)
    const box2Area = (box2.xmax - box2.xmin) * (box2.ymax - box2.ymin)
    const minArea = Math.min(box1Area, box2Area)
    
    return minArea > 0 ? overlapArea / minArea : 0
}

function calculateCenter(box: BoundingBox): { x: number; y: number } {
    return {
        x: (box.xmin + box.xmax) / 2,
        y: (box.ymin + box.ymax) / 2
    }
}

function calculateDistance(box1: BoundingBox, box2: BoundingBox): number {
    const c1 = calculateCenter(box1)
    const c2 = calculateCenter(box2)
    return Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2))
}

interface DetectionInput {
    id: string;
    label: string;
    box: number[];
    confidence: number;
    severity: 'critical' | 'moderate' | 'normal';
    [key: string]: unknown;
}

function validateAndMergeDetections(detections: DetectionInput[]): DetectionInput[] {
    if (detections.length === 0) return detections
    
    const validated = detections.map((d, index) => {
        // Format is [ymin, xmin, ymax, xmax] — extract by index, then sort each axis
        // so inverted boxes (ymin > ymax) are handled gracefully
        const box: BoundingBox = {
            ymin: Math.max(0, Math.min(d.box[0] ?? 0, d.box[2] ?? 0)),
            xmin: Math.max(0, Math.min(d.box[1] ?? 0, d.box[3] ?? 0)),
            ymax: Math.min(100, Math.max(d.box[0] ?? 0, d.box[2] ?? 0)),
            xmax: Math.min(100, Math.max(d.box[1] ?? 0, d.box[3] ?? 0)),
        }
        
        let confidence = d.confidence ?? 0.85
        const boxWidth = box.xmax - box.xmin
        const boxHeight = box.ymax - box.ymin
        const boxArea = boxWidth * boxHeight
        
        if (boxArea > 50) {
            console.warn(`Detection "${d.label}" (${index}) has oversized box (${boxArea.toFixed(1)}% of image), reducing confidence by 20%`)
            confidence = Math.max(0.1, confidence * 0.8)
        }
        
        if (boxWidth > 80 || boxHeight > 80) {
            console.warn(`Detection "${d.label}" (${index}) has extremely large box, marking as low precision`)
            confidence = Math.max(0.1, confidence * 0.5)
        }
        
        return {
            ...d,
            box: [box.ymin, box.xmin, box.ymax, box.xmax],
            confidence,
            _warnings: [] as string[]
        }
    })
    
    const toRemove = new Set<number>()
    const toMerge: { indices: number[]; merged: DetectionInput }[] = []
    
    for (let i = 0; i < validated.length; i++) {
        if (toRemove.has(i)) continue
        
        const overlapping: number[] = [i]
        
        for (let j = i + 1; j < validated.length; j++) {
            if (toRemove.has(j)) continue
            
            const overlap = calculateOverlap(
                { ymin: validated[i].box[0], xmin: validated[i].box[1], ymax: validated[i].box[2], xmax: validated[i].box[3] },
                { ymin: validated[j].box[0], xmin: validated[j].box[1], ymax: validated[j].box[2], xmax: validated[j].box[3] }
            )
            
            if (overlap > 0.3) {
                overlapping.push(j)
                toRemove.add(j)
            } else {
                const distance = calculateDistance(
                    { ymin: validated[i].box[0], xmin: validated[i].box[1], ymax: validated[i].box[2], xmax: validated[i].box[3] },
                    { ymin: validated[j].box[0], xmin: validated[j].box[1], ymax: validated[j].box[2], xmax: validated[j].box[3] }
                )
                
                if (distance < 5 && validated[i].label.toLowerCase() === validated[j].label.toLowerCase()) {
                    overlapping.push(j)
                    toRemove.add(j)
                }
            }
        }
        
        if (overlapping.length > 1) {
            const boxes = overlapping.map(idx => ({
                ymin: validated[idx].box[0], xmin: validated[idx].box[1],
                ymax: validated[idx].box[2], xmax: validated[idx].box[3]
            }))
            
            const mergedBox: BoundingBox = {
                ymin: Math.min(...boxes.map(b => b.ymin)),
                xmin: Math.min(...boxes.map(b => b.xmin)),
                ymax: Math.max(...boxes.map(b => b.ymax)),
                xmax: Math.max(...boxes.map(b => b.xmax))
            }
            
            const avgConfidence = overlapping.reduce((sum, idx) => sum + validated[idx].confidence, 0) / overlapping.length
            const highestSeverity = overlapping.some(idx => validated[idx].severity === 'critical') ? 'critical'
                : overlapping.some(idx => validated[idx].severity === 'moderate') ? 'moderate' : 'normal'
            
            const merged: DetectionInput = {
                ...validated[i],
                id: `det-merged-${i}`,
                box: [mergedBox.ymin, mergedBox.xmin, mergedBox.ymax, mergedBox.xmax],
                confidence: avgConfidence,
                severity: highestSeverity,
                label: validated[i].label,
                _warnings: [`Merged ${overlapping.length} overlapping detections`]
            }
            
            toMerge.push({ indices: overlapping, merged })
        }
    }
    
    const result = validated.filter((_, idx) => !toRemove.has(idx)).map((d, idx) => {
        const mergedRef = toMerge.find(m => m.indices.includes(idx))
        if (mergedRef) {
            return { ...mergedRef.merged, id: `det-${idx}` }
        }
        return { ...d, id: `det-${idx}` }
    })
    
    if (toRemove.size > 0) {
        console.log(`Validation: merged ${toRemove.size} overlapping/duplicate detections`)
    }
    
    return result
}

function mapAnalysisToResponse(analysis: z.infer<typeof VisionSchema>) {
    const qualityScore = analysis.meta.qualityScore
    const avgDetectionConfidence = analysis.detections.length > 0
        ? analysis.detections.reduce((sum, d) => sum + (d.confidence ?? 0.8), 0) / analysis.detections.length
        : 0.8
    const overallPrecision = Math.round((qualityScore * 0.4 + avgDetectionConfidence * 100 * 0.6))

    const detections = analysis.detections.map((d, i) => {
        return {
            id: `det-${i}`,
            label: d.label,
            confidence: d.confidence ?? 0.85,
            box: {
                ymin: d.box[0],
                xmin: d.box[1],
                ymax: d.box[2],
                xmax: d.box[3]
            },
            severity: d.severity,
            description: d.description,
            detailedDescription: d.detailedDescription,
            anatomicalRegion: d.anatomicalRegion,
            cidCode: d.cidCode,
            differentialDiagnosis: d.differentialDiagnosis,
            clinicalSignificance: d.clinicalSignificance,
            recommendedActions: d.recommendedActions,
        }
    })

    let findings = analysis.detections.map(d => ({
        type: d.label,
        zone: d.description ? d.description.slice(0, 50) : (d.anatomicalRegion ? d.anatomicalRegion : 'Região Identificada'),
        level: d.severity === 'critical' ? 'Crítico' : d.severity === 'moderate' ? 'Moderado' : 'Normal',
        color: d.severity === 'critical' ? 'text-red-500' : d.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500',
        confidence: d.confidence ?? 0.85
    }))

    // Fallback: extract findings from report if detections is empty
    if (findings.length === 0 && analysis.report.detailedFindings) {
        const findingsText = analysis.report.detailedFindings
        const keywords = [
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

        const extractedFindings: typeof findings = []
        for (const kw of keywords) {
            if (kw.pattern.test(findingsText)) {
                extractedFindings.push({
                    type: kw.type,
                    zone: 'Identificado no laudo',
                    level: kw.severity === 'critical' ? 'Crítico' : kw.severity === 'moderate' ? 'Moderado' : 'Normal',
                    color: kw.severity === 'critical' ? 'text-red-500' : kw.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500',
                    confidence: avgDetectionConfidence
                })
            }
        }

        if (extractedFindings.length > 0) {
            findings = extractedFindings
        }
    }

    return {
        meta: analysis.meta,
        detections,
        report: analysis.report,
        findings,
        precision: overallPrecision
    }
}

export async function POST(req: Request) {
    try {
        // --- Auth ---
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // --- Parse body ---
        const body = await req.json()
        const { image, clinicalContext, mode, originalAnalysisSummary, model, specialty } = body
        const specialtyConfig = getSpecialtyConfig(specialty)

        // Créditos desabilitados — não há verificação de limite

        if (!image) {
            return new Response(JSON.stringify({ error: 'Image data is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        let imageData = image
        if (!image.startsWith('data:') && !image.startsWith('http')) {
            imageData = `data:image/jpeg;base64,${image}`
        }

        const payloadCheck = validateImagePayload(imageData)
        if (!payloadCheck.valid) {
            return new Response(JSON.stringify({ error: payloadCheck.message }), {
                status: 413,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!hasMedVisionOpenRouterKey()) {
            console.error(
                'Vision analysis error: configure MEDVISION_OPENROUTER_API_KEY ou OPENROUTER_API_KEY'
            )
            return new Response(JSON.stringify({ error: 'API not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Resolve which models to use: user-selected or default fallback chain
        const modelsToUse: readonly string[] = (model && VISION_MODEL_IDS.has(model))
            ? [model]
            : VISION_MODELS

        // --- Call AI ---
        let analysis: z.infer<typeof VisionSchema>

        if (mode === 'refine' && originalAnalysisSummary) {
            console.log('Mode: refine - usando callVisionRefinement')
            analysis = await callVisionRefinement(imageData, originalAnalysisSummary, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'quick') {
            console.log('Mode: quick - usando callVisionAI (single-pass)')
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse, specialtyConfig)
        } else if (mode === 'preview') {
            console.log('Mode: preview - usando callVisionDetection (detecção rápida)')
            const quickResult = await callVisionDetection(imageData, clinicalContext, modelsToUse, specialtyConfig)
            const validatedDetections = validateAndMergeDetections(quickResult.quickDetections.map((d, i) => ({
                id: `det-${i}`,
                label: d.label,
                box: d.box,
                confidence: d.confidence,
                severity: d.severity,
                anatomicalRegion: d.anatomicalRegion as string | undefined
            })))
            
            const previewResponse = {
                meta: quickResult.meta,
                detections: validatedDetections.map((d, i) => ({
                    id: d.id as string,
                    label: d.label,
                    confidence: d.confidence,
                    box: {
                        ymin: d.box[0],
                        xmin: d.box[1],
                        ymax: d.box[2],
                        xmax: d.box[3]
                    },
                    severity: d.severity,
                    anatomicalRegion: d.anatomicalRegion as string | undefined
                })),
                isPreview: true
            }
            await deductCredits(user.id, modelsToUse[0], 'vision', 'Preview de detecção')
            return Response.json(previewResponse)
        } else {
            console.log('Mode: default (two-stage) - usando callTwoStageVisionAnalysis')
            analysis = await callTwoStageVisionAnalysis(imageData, clinicalContext, modelsToUse, specialtyConfig)
        }

        // Debitar créditos após análise bem-sucedida
        await deductCredits(user.id, modelsToUse[0], 'vision')

        const responseData = mapAnalysisToResponse(analysis)
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

        return new Response(JSON.stringify({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }), {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
