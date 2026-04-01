
import { openrouter, MODELS, VISION_MODEL_IDS } from '@/lib/ai/openrouter'
import { generateText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { deductCredits } from '@/lib/credits/service'

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
    label: z.string().describe("Nome curto da patologia ou estrutura identificada (ex: 'Cárie', 'Perda Óssea')."),
    box: z.array(z.number().min(0).max(100)).length(4)
        .refine(b => b[0] < b[2] && b[1] < b[3], {
            message: "Coordenadas inválidas: ymin deve ser < ymax e xmin deve ser < xmax",
        })
        .describe("Coordenadas PRECISAS [ymin, xmin, ymax, xmax] normalizadas de 0 a 100. Cada valor deve ser decimal 0-100. ymin < ymax e xmin < xmax. Delimite EXATAMENTE a área mínima do achado."),
    severity: z.enum(['critical', 'moderate', 'normal']).describe("Nível de severidade do achado."),
    confidence: z.number().min(0).max(1).describe("Grau de confiança do achado de 0 a 1, refletindo a certeza diagnóstica."),
    description: z.string().optional().describe("Breve descrição técnica do achado (1-2 frases)."),
    detailedDescription: z.string().optional().describe("Descrição técnica detalhada do achado (3-5 frases) com terminologia especializada."),
    toothNumber: z.string().optional().describe("Número do dente em notação FDI (ex: '26', '11', '36-37'). Omita se não aplicável à imagem."),
    cidCode: z.string().optional().describe("Código CID-10 correspondente ao achado (ex: 'K02.1' para cárie de dentina, 'K05.3' para periodontite crônica, 'K04.5' para lesão periapical crônica)."),
    differentialDiagnosis: z.array(z.string()).optional().describe("Lista de 2-3 diagnósticos diferenciais para este achado específico."),
    clinicalSignificance: z.enum(['alta', 'media', 'baixa']).optional().describe("Significância clínica do achado: alta (requer ação imediata), media (monitorar/tratar em breve), baixa (acompanhamento de rotina)."),
    recommendedActions: z.array(z.string()).optional().describe("Lista de 1-3 ações recomendadas específicas para ESTE achado (ex: 'Restauração classe II com resina composta', 'Sondagem periodontal completa')."),
    // Novos campos específicos por tipo de detecção
    detectionType: z.enum(['caries', 'periodontal', 'periapical', 'restoration', 'fracture', 'implant', 'calculus', 'resorption', 'cyst', 'tumor', 'anomaly', 'other']).optional().describe("Tipo de detecção para分类."),
    // Dados específicos para cáries
    cariesData: z.object({
        blackClass: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']).optional().describe("Classe de Black (I-VI)."),
        surface: z.enum(['O', 'M', 'D', 'B', 'L', 'F', 'MO', 'DO', 'BO', 'LO']).optional().describe("Superfície afetada: O=oclusal, M=mesial, D=distal, B=buccal, L=lingual, F=facial, MO=mesio-oclusal, etc."),
        depth: z.enum(['inicial', 'moderada', 'avancada']).optional().describe("Profundidade: inicial (<1/3 dentina), moderada (1/3-2/3), avançada (>2/3)."),
        involvedPulp: z.boolean().optional().describe("Se está próxima ou atinge a polpa."),
    }).optional().describe("Dados específicos para cáries."),
    // Dados específicos para restaurações
    restorationData: z.object({
        type: z.enum(['amalgam', 'resina', 'ionomero', 'ouro', 'porcelana', 'provisoria', 'outro']).optional().describe("Tipo de restauração."),
        condition: z.enum(['integra', 'fraturada', 'infiltração', 'desadaptada', 'carie_recidiva', 'descolorida']).optional().describe("Condição da restauração."),
        marginalDefect: z.boolean().optional().describe("Defeito marginal visível."),
        overhang: z.boolean().optional().describe("Overhang/excesso de material."),
    }).optional().describe("Dados específicos para restaurações."),
    // Dados específicos para fraturas
    fractureData: z.object({
        location: z.enum(['coronaria_radicular', 'radicular', 'coroa']).optional().describe("Localização da fratura."),
        direction: z.enum(['horizontal', 'vertical', 'obliqua', 'inclinada']).optional().describe("Direção da fratura."),
        extendsToCementum: z.boolean().optional().describe("Se estende até o cemento."),
        displacement: z.boolean().optional().describe("Se há deslocamento dos fragmentos."),
    }).optional().describe("Dados específicos para fraturas."),
    // Dados específicos para implantes
    implantData: z.object({
        type: z.enum(['osseointegrado', 'subperiosteal', 'zirconia']).optional().describe("Tipo de implante."),
        condition: z.enum(['saudavel', 'periimplantite', 'mucosite', 'falha']).optional().describe("Condição peri-implantar."),
        boneLoss: z.number().optional().describe("Perda óssea em mm ao redor do implante."),
        mobility: z.boolean().optional().describe("Se há mobilidade."),
    }).optional().describe("Dados específicos para implantes."),
    // Dados para cálculo
    calculusData: z.object({
        location: z.enum(['supragengival', 'subgengival', 'ambos']).optional().describe("Localização do cálculo."),
        extent: z.enum(['localizado', 'generalizado']).optional().describe("Extensão."),
    }).optional().describe("Dados específicos para cálculo."),
    // Dados para reabsorção
    resorptionData: z.object({
        type: z.enum(['interna', 'externa', 'cervical']).optional().describe("Tipo de reabsorção."),
        location: z.enum(['coronal', 'media', 'apical']).optional().describe("Localização."),
        severity: z.enum(['leve', 'moderada', 'severa']).optional().describe("Gravidade."),
    }).optional().describe("Dados específicos para reabsorção."),
})

const VisionSchema = z.object({
    meta: z.object({
        imageType: z.enum(['Periapical', 'Panorâmica', 'Interproximal (Bitewing)', 'Oclusal', 'Foto Intraoral', 'Tomografia', 'Desconhecido']).describe("Tipo da imagem odontológica."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem para fins diagnósticos."),
        qualityScore: z.number().min(0).max(100).describe("Pontuação de qualidade de 0 a 100 para fins de cálculo de precisão."),
        notes: z.string().optional().describe("Notas sobre a qualidade técnica (ex: 'Sobreposição', 'Distorção', 'Baixo contraste').")
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
        imageType: z.enum(['Periapical', 'Panorâmica', 'Interproximal (Bitewing)', 'Oclusal', 'Foto Intraoral', 'Tomografia', 'Desconhecido']).describe("Tipo da imagem odontológica."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem."),
        qualityScore: z.number().min(0).max(100),
    }),
    quickDetections: z.array(z.object({
        label: z.string().describe("Nome curto da patologia (ex: 'Cárie', 'Perda Óssea')."),
        box: z.array(z.number()).length(4).describe("Coordenadas [ymin, xmin, ymax, xmax] normalizadas 0-100."),
        severity: z.enum(['critical', 'moderate', 'normal']),
        confidence: z.number().min(0).max(1),
        toothNumber: z.string().optional().describe("Número do dente em notação FDI quando aplicável."),
    })).describe("Lista de anomalias detectadas na imagem.")
})

// Schema para Estágio 2: Análise detalhada por detecção
const DetailedDetectionSchema = z.object({
    detailedAnalysis: z.array(z.object({
        originalIndex: z.number().describe("Índice da detecção original (0, 1, 2...)"),
        label: z.string(),
        toothNumber: z.string().optional(),
        cidCode: z.string().optional().describe("Código CID-10 principal para o achado."),
        cariesClassification: z.object({
            blackClass: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']).optional().describe("Classe de Black (se cárie)."),
            surface: z.enum(['O', 'M', 'D', 'B', 'L', 'F']).optional().describe("Superfície: O=oclusal, M=mesial, D=distal, B=buccal, L=lingual, F=faces."),
            depth: z.enum(['inicial', 'moderada', 'avancada']).optional().describe("Profundidade da cárie.")
        }).optional().describe("Classificação de Black (apenas para cáries)."),
        periodontalData: z.object({
            boneLoss: z.number().optional().describe("Percentual de perda óssea."),
            probingDepth: z.number().optional().describe("Profundidade de sondagem em mm."),
            mobility: z.enum(['0', '1', '2', '3']).optional().describe("Grau de mobilidade."),
            furcation: z.enum(['I', 'II', 'III', 'N']).optional().describe("Envolvimento de furca.")
        }).optional().describe("Dados periodontais (se doença periodontal)."),
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

// Fallback chain de modelos Gemini para visão
const VISION_MODELS = [
    MODELS.vision,              // google/gemini-3.1-pro-preview
    MODELS.visionFallback1,      // google/gemini-3-pro-preview
    MODELS.visionFallback2,     // google/gemini-2.5-pro
] as const

type VisionModelId = typeof VISION_MODELS[number]

async function callWithFallback<T>(
    modelIds: readonly string[],
    generateFn: (modelId: string) => Promise<T>,
    attempt = 1
): Promise<T> {
    const currentIndex = Math.min(Math.floor((attempt - 1) / 3), modelIds.length - 1)
    const currentModel = modelIds[currentIndex]
    const maxAttemptsPerModel = 3
    
    const modelAttempt = ((attempt - 1) % maxAttemptsPerModel) + 1

    try {
        console.log(`Trying model: ${currentModel} (attempt ${modelAttempt}/${maxAttemptsPerModel})`)
        return await generateFn(currentModel)
    } catch (error) {
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
            error.name === 'ZodError' ||
            error.name === 'SyntaxError'
        )

        const nextAttempt = attempt + 1
        const nextModelIndex = Math.floor((nextAttempt - 1) / maxAttemptsPerModel)
        
        if (isRetryable && nextModelIndex < modelIds.length) {
            const waitTime = modelAttempt * 1500
            console.warn(`Model ${currentModel} failed (attempt ${modelAttempt}), waiting ${waitTime}ms before trying next model...`)
            await sleep(waitTime)
            return callWithFallback(modelIds, generateFn, nextAttempt)
        }
        
        if (isRetryable && modelAttempt < maxAttemptsPerModel) {
            const retryWaitTime = modelAttempt * 1500
            console.warn(`Model ${currentModel} failed (attempt ${modelAttempt}), retrying same model in ${retryWaitTime}ms...`)
            await sleep(retryWaitTime)
            return callWithFallback(modelIds, generateFn, nextAttempt)
        }

        throw error
    }
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

const SYSTEM_PROMPT_BASE = `Você é o OdontoAI Vision, um radiologista e estomatologista renomado com especialização em diagnóstico por imagem odontológica.
Sua tarefa é analisar imagens odontológicas e gerar um LAUDO TÉCNICO PROFISSIONAL COMPLETO com máxima precisão diagnóstica.

DIRETRIZES DE ANÁLISE:
1. Classifique o tipo da imagem e sua qualidade técnica (atribua um qualityScore de 0-100).
2. Identifique TODOS os tipos de anomalias listados abaixo, FORNECENDO dados específicos para cada tipo:

A) CÁRIES (detectionType: 'caries')
   - Forneça: Classe de Black (I-VI), superfície afetada (O/M/D/B/L/F), profundidade (inicial/moderada/avançada), se atinge polpa
   - CID-10: K02.0-K02.9

B) DOENÇA PERIODONTAL (detectionType: 'periodontal')
   - Forneça: Nível de perda óssea (%), padrão (horizontal/vertical), profundidade de bolsa
   - CID-10: K05.1-K05.6

C) LESÕES PERIAPICAIS (detectionType: 'periapical')
   - Forneça: Tipo (radiolúcida/radiopaca), extensão, relação com ápice
   - CID-10: K04.1-K04.9, K05.3-K05.6

D) RESTAURAÇÕES (detectionType: 'restoration')
   - Forneça: Tipo (amálgama/resina/ionômero/ouro/porcelana), condição (integra/fraturada/infiltração/desadaptada), defeito marginal, overhang
   - CID-10: K08.5 (defeito de restauração)

E) FRATURAS (detectionType: 'fracture')
   - Forneça: Localização (coronária/radicular/coroa), direção (horizontal/vertical/oblíqua), se estende ao cemento, deslocamento
   - CID-10: S02.5 (fratura dentária)

F) IMPLANTES (detectionType: 'implant')
   - Forneça: Tipo (osseointegrado/subperiosteal/zircônia), condição (saudável/peri-implantite/mucosite), perda óssea em mm, mobilidade
   - CID-10: Z96.1 (implante dentário)

G) CÁLCULO DENTAL (detectionType: 'calculus')
   - Forneça: Localização (supragengival/subgengival/ambos), extensão (localizado/generalizado)
   - CID-10: K03.6 (cálculo dentário)

H) REABSORÇÕES (detectionType: 'resorption')
   - Forneça: Tipo (interna/externa/cervical), localização (coronal/média/apical), gravidade (leve/moderada/severa)
   - CID-10: K03.3 (reabsorção dentária)

I) CISTOS E TUMORES (detectionType: 'cyst' ou 'tumor')
   - Forneça: Localização, extensão, características radiográficas
   - CID-10: K09.0-K09.9 (cistos), D10-D16 (tumores benignos)

3. Use terminologia técnica PRECISA: "imagem radiolúcida", "reabsorção óssea horizontal de grau X", "lesão sugestiva de...", "radiopacidade compatível com...".
4. NUMERAÇÃO FDI: Para CADA achado que envolva um dente específico, identifique o número do dente em notação FDI Internacional (11-18 superior direito, 21-28 superior esquerdo, 31-38 inferior esquerdo, 41-48 inferior direito).
5. CID-10: Para cada achado patológico, forneça o código CID-10 correspondente. Exemplos:
   - K02.0 Cárie limitada ao esmalte, K02.1 Cárie de dentina, K02.3 Cárie de cemento
   - K05.1 Gengivite crônica, K05.2 Periodontite aguda, K05.3 Periodontite crônica
   - K04.0 Pulpite, K04.5 Periodontite apical crônica, K04.6 Abscesso periapical
   - K09.0 Cisto periodontal apical, K10.0 Distúrbio do desenvolvimento dos maxilares
   - S02.5 Fratura dentária, K03.6 Cálculo dentário
   - K03.3 Reabsorção dentária, Z96.1 Implante dentário
6. DIAGNÓSTICO DIFERENCIAL: Para cada achado relevante, liste 2-3 diagnósticos alternativos.
7. SIGNIFICÂNCIA CLÍNICA: Classifique cada achado como 'alta' (tratamento imediato), 'media' (tratamento em breve), 'baixa' (monitorar).
8. Para cada achado, forneça ações clínicas recomendadas específicas e práticas.

REGRA DE FLEXIBILIDADE: Mesmo que a imagem seja de baixa qualidade, SEMPRE tente gerar achados e laudo. Se a qualidade for ruim, reduza o confidence dos achados proporcionalmente e indique isso no laudo. Nunca recuse analisar uma imagem.

SOBRE AS COORDENADAS (BOX) - REGRAS ABSOLUTAS:
- Cada bounding box deve ser o MENOR RETÂNGULO POSSÍVEL que contém apenas o achado específico.
- NÃO use boxes que cobrem múltiplos dentes, quadrantes inteiros ou grandes regiões genéricas.
- Para dentes individuais: box deve cobrir SOMENTE aquele dente.
- Para lesões periapicais: box cobre apenas a lesão radiolúcida + ápice imediato, NÃO a mandíbula.
- Para perda óssea: box na região do septo interproximal afetado, não em toda a arcada.
- Se dois achados estão no mesmo dente: crie DOIS boxes distintos e precisos para cada um.
- Use decimais (ex: 23.5) para máxima precisão.
- Tamanho típico de um box individual: 5–25% da imagem. Boxes acima de 40% serão descartados.

LIMITE DE DETECÇÕES: Retorne no máximo 8 detecções. Priorize por relevância clínica (crítico > moderado > normal). Se houver mais de 8, omita as de menor significância.

REGRA CRÍTICA: Se você descrever um achado no report, DEVE existir uma entrada correspondente em detections.

IDIOMA: Português do Brasil (pt-BR) formal e técnico.`

const JSON_SCHEMA_EXAMPLE = `{
  "meta": {
    "imageType": "Periapical" | "Panorâmica" | "Interproximal (Bitewing)" | "Oclusal" | "Foto Intraoral" | "Tomografia" | "Desconhecido",
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
      "toothNumber": string (FDI, ex: "26", opcional),
      "cidCode": string (CID-10, ex: "K02.1", opcional),
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
      { "tooth": string (FDI), "findings": string, "cidCode": string (opcional), "severity": "critical"|"moderate"|"normal" (opcional) }
    ] (opcional),
    "differentialDiagnosis": string (discussão detalhada, opcional)
  }
}`

async function callVisionAI(imageData: string, clinicalContext?: string, models: readonly string[] = VISION_MODELS): Promise<z.infer<typeof VisionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null

    const generateWithModel = async (modelId: string): Promise<z.infer<typeof VisionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'GERE UM LAUDO RADIOGRÁFICO DETALHADO E COMPLETO. Analise esta imagem com máxima precisão técnica. Para cada achado: (1) bounding box preciso e justo, (2) número do dente FDI quando aplicável, (3) código CID-10, (4) diagnóstico diferencial, (5) ações recomendadas específicas. Inclua perToothBreakdown e differentialDiagnosis no report. Responda SOMENTE com o JSON.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO FORNECIDO PELO PROFISSIONAL:\n${safeContext}\n\nConsidere este contexto ao formular hipóteses diagnósticas e recomendações.` })
        }

        const result = await generateText({
            model: openrouter(modelId),
            maxOutputTokens: 8000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${SYSTEM_PROMPT_BASE}

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
    models: readonly string[] = VISION_MODELS
): Promise<z.infer<typeof VisionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null

    const generateWithModel = async (modelId: string): Promise<z.infer<typeof VisionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'RE-ANALISE esta região específica com máximo detalhe e precisão. Identifique achados sutis, forneça descrições técnicas aprofundadas, CID-10, diagnósticos diferenciais e ações recomendadas. As coordenadas devem ser relativas a esta imagem recortada. Responda SOMENTE com o JSON.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouter(modelId),
            maxOutputTokens: 6000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${SYSTEM_PROMPT_BASE}

MODO DE REFINAMENTO: Você está re-analisando uma REGIÃO ESPECÍFICA extraída de uma imagem odontológica maior.
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

const QUICK_DETECTION_PROMPT = `Você é um assistente de diagnóstico odontológico por imagem.
Sua tarefa é realizar uma DETECÇÃO RÁPIDA de anomalias na imagem radiográfica.

DIRETRIZES:
1. Identifique TODAS as anomalias presentes na imagem
2. Para cada anomalia: forneça bounding box preciso, severidade inicial, confiança e número do dente FDI se aplicável
3. NÃO faça descrições detalhadas ainda - isso será feito no Estágio 2
4. Sea imagem for de baixa qualidade, reduza a confiança proporcionalmente
5. Sempre retorne pelo menos meta e quickDetections

NOTAÇÃO FDI:
- Superior direito: 11-18
- Superior esquerdo: 21-28
- Inferior esquerdo: 31-38
- Inferior direito: 41-48

IDIOMA: Português do Brasil.`

const QUICK_DETECTION_SCHEMA = `{
  "meta": {
    "imageType": "Periapical" | "Panorâmica" | "Interproximal (Bitewing)" | "Oclusal" | "Foto Intraoral" | "Tomografia" | "Desconhecido",
    "quality": "Excelente" | "Boa" | "Aceitável" | "Ruim" | "Inadequada",
    "qualityScore": number (0-100)
  },
  "quickDetections": [
    {
      "label": string,
      "box": [ymin, xmin, ymax, xmax] (0-100),
      "severity": "critical" | "moderate" | "normal",
      "confidence": number (0-1),
      "toothNumber": string (FDI, opcional)
    }
  ]
}`

const DETAILED_ANALYSIS_PROMPT = `Você é um assistente de diagnóstico odontológico por imagem.
Você está no ESTÁGIO 2: Análise Detalhada.

Foi fornecida uma lista de detecções do Estágio 1. Sua tarefa é fornecer uma análise DETALHADA para CADA uma delas.

Para cada detecção, forneça:
1. CID-10 correspondente (ex: K02.1 para cárie de dentina, K05.3 para periodontite crônica)
2. Classificação de Black (se cárie): classe (I-VI), superfície (O/M/D/B/L/F), profundidade
3. Dados periodontais (se doença periodontal): perda óssea %, profundidade de sondagem, mobilidade, furca
4. Diagnóstico diferencial: 2-3 alternativas diagnósticas
5. Significância clínica: alta/media/baixa
6. Ações recomendadas específicas para este achado
7. Descrição técnica detalhada (3-5 frases)

CÓDIGOS CID-10 IMPORTANTES:
- K02.0 Cárie limitada ao esmalte
- K02.1 Cárie de dentina
- K04.0 Pulpite
- K04.5 Periodontite apical crônica
- K04.6 Abscesso periapical
- K05.1 Gengivite crônica
- K05.3 Periodontite crônica
- K05.5 Perda dentária por periodontite
- K08.5 Anomalia dentária
- K00 Anomalias de desenvolvimento
- S02.5 Fratura dentária

IDIOMA: Português do Brasil técnico.`

const DETAILED_ANALYSIS_SCHEMA = `{
  "detailedAnalysis": [
    {
      "originalIndex": number,
      "label": string,
      "toothNumber": string (opcional),
      "cidCode": string (CID-10, opcional),
      "cariesClassification": {
        "blackClass": "I" | "II" | "III" | "IV" | "V" | "VI" (opcional),
        "surface": "O" | "M" | "D" | "B" | "L" | "F" (opcional),
        "depth": "inicial" | "moderada" | "avancada" (opcional)
      } (opcional),
      "periodontalData": {
        "boneLoss": number (opcional),
        "probingDepth": number (opcional),
        "mobility": "0" | "1" | "2" | "3" (opcional),
        "furcation": "I" | "II" | "III" | "N" (opcional)
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
    models: readonly string[] = VISION_MODELS
): Promise<z.infer<typeof QuickDetectionSchema>> {
    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null

    const generateWithModel = async (modelId: string): Promise<z.infer<typeof QuickDetectionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: 'Realize uma detecção rápida de todas as anomalias nesta imagem radiográfica. Identifique: cáries, perdas ósseas, lesões periapicais, restaurações, anomalias dentárias, etc. Forneça bounding boxes precisos e número do dente FDI quando aplicável.' },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouter(modelId),
            maxOutputTokens: 4000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${QUICK_DETECTION_PROMPT}

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
    models: readonly string[] = VISION_MODELS
): Promise<z.infer<typeof DetailedDetectionSchema>> {
    const detectionsSummary = quickDetections.map((d, i) =>
        `${i}: ${d.label} (${d.toothNumber || 'N/A'}) - ${d.severity} - confiança ${Math.round(d.confidence * 100)}%`
    ).join('\n')

    const safeContext = clinicalContext?.trim() ? sanitizeClinicalContext(clinicalContext) : null

    const generateWithModel = async (modelId: string): Promise<z.infer<typeof DetailedDetectionSchema>> => {
        const userTextParts: { type: 'text'; text: string }[] = [
            { type: 'text' as const, text: `Forneça análise detalhada para cada uma das ${quickDetections.length} detecções listadas acima. Para cada uma: CID-10, classificação (Black para cáries, dados periodontais), diagnóstico diferencial, significância clínica, ações recomendadas, e descrição técnica.` },
        ]
        if (safeContext) {
            userTextParts.push({ type: 'text' as const, text: `CONTEXTO CLÍNICO: ${safeContext}` })
        }

        const result = await generateText({
            model: openrouter(modelId),
            maxOutputTokens: 6000,
            messages: [
                {
                    role: 'system' as const,
                    content: `${DETAILED_ANALYSIS_PROMPT}

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
    models: readonly string[] = VISION_MODELS
): Promise<z.infer<typeof VisionSchema>> {
    console.log('=== ESTÁGIO 1: Detecção Rápida ===')
    const quickResult = await callVisionDetection(imageData, clinicalContext, models)
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
        const detailedResult = await callVisionDetailedAnalysis(imageData, quickResult.quickDetections, clinicalContext, models)
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
            toothNumber: qd.toothNumber ?? detailed?.toothNumber,
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

    // ============================================================
    // CROSS-VALIDATION PARA CASOS CRÍTICOS
    // ============================================================
    const hasCriticalDetections = detections.some(d => d.severity === 'critical')
    // Skip cross-validation when a single user-selected model is used to avoid overriding their choice
    if (hasCriticalDetections && models.length > 1) {
        console.log('=== CROSS-VALIDATION: Verificando detecções críticas ===')
        detections = await crossValidateCriticalDetections(imageData, detections as DetectionInput[], clinicalContext) as typeof detections
    }

    // Gerar relatório consolidado
    const perToothBreakdown = Object.entries(
        detections.reduce((acc, det) => {
            const tooth = det.toothNumber || 'Não identificado'
            if (!acc[tooth]) acc[tooth] = []
            acc[tooth].push(det)
            return acc
        }, {} as Record<string, typeof detections>)
    ).map(([tooth, dets]): { tooth: string; findings: string; cidCode?: string; severity?: 'critical' | 'moderate' | 'normal' } => ({
        tooth,
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
            `- ${d.label}${d.toothNumber ? ` (Dente ${d.toothNumber})` : ''}: ${d.detailedDescription || d.description || ''}`
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

// ============================================================
// CROSS-VALIDATION PARA CASOS CRÍTICOS
// ============================================================

async function crossValidateCriticalDetections(
    imageData: string,
    detections: DetectionInput[],
    clinicalContext?: string
): Promise<DetectionInput[]> {
    const criticalDetections = detections.filter(d => d.severity === 'critical')
    
    if (criticalDetections.length === 0) {
        console.log('No critical detections to cross-validate')
        return detections
    }
    
    console.log(`Cross-validating ${criticalDetections.length} critical detections with secondary model...`)
    
    const validationSummary = criticalDetections.map((d, i) => 
        `${i}: ${d.label} no dente ${d.toothNumber || 'N/A'} (confiança ${Math.round(d.confidence * 100)}%)`
    ).join('\n')
    
    try {
        const result = await generateText({
            model: openrouter(MODELS.visionFallback2), // Use Gemini 2.5 Pro para validação
            maxOutputTokens: 2000,
            messages: [
                {
                    role: 'system' as const,
                    content: `Você é um validador de diagnósticos odontológicos. Analise a imagem e verifique se as detecções críticas listadas são realmente válidas.

Para cada detecção crítica, forneça:
1. É válida? (sim/não)
2. Se não, qual o diagnóstico correto?
3. Confiança revisada (0-1)

IDIOMA: Português do Brasil. Responda em JSON: {"validations": [{"index": number, "isValid": boolean, "correctedLabel": string, "revisedConfidence": number}]}`
                },
                {
                    role: 'user' as const,
                    content: [
                        { type: 'text' as const, text: `Valide estas ${criticalDetections.length} detecções críticas:\n${validationSummary}\n\nPara cada uma, responda: é válida? Se não, qual o diagnóstico correto?` },
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })
        
        type ValidationItem = { index?: number; isValid: boolean; correctedLabel?: string; revisedConfidence?: number }
        const parsed = extractJSON(result.text) as { validations?: ValidationItem[] }
        const validations: ValidationItem[] = parsed.validations || []
        
        const validatedDetections = detections.map(d => {
            if (d.severity !== 'critical') return d
            
            const validation = validations.find(v =>
                v.index !== undefined && d.id.includes(String(v.index))
            )
            
            if (validation && !validation.isValid) {
                console.warn(`Cross-validation: Detection "${d.label}" marked as invalid, applying correction`)
                return {
                    ...d,
                    label: validation.correctedLabel || d.label,
                    confidence: validation.revisedConfidence || d.confidence * 0.7,
                    _validated: true,
                    _validationNote: 'Modified by cross-validation'
                }
            }
            
            if (validation && validation.revisedConfidence) {
                const diff = Math.abs(d.confidence - validation.revisedConfidence)
                if (diff > 0.2) {
                    console.warn(`Cross-validation: Confidence adjusted from ${d.confidence} to ${validation.revisedConfidence}`)
                    return {
                        ...d,
                        confidence: validation.revisedConfidence,
                        _validated: true
                    }
                }
            }
            
            return { ...d, _validated: true }
        })
        
        console.log(`Cross-validation complete: ${validations.filter(v => v.isValid).length}/${criticalDetections.length} confirmed`)
        return validatedDetections
        
    } catch (error) {
        console.error('Cross-validation failed, keeping original detections:', error)
        return detections
    }
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
            toothNumber: d.toothNumber,
            cidCode: d.cidCode,
            differentialDiagnosis: d.differentialDiagnosis,
            clinicalSignificance: d.clinicalSignificance,
            recommendedActions: d.recommendedActions,
        }
    })

    let findings = analysis.detections.map(d => ({
        type: d.label,
        zone: d.description ? d.description.slice(0, 50) : (d.toothNumber ? `Dente ${d.toothNumber}` : 'Região Identificada'),
        level: d.severity === 'critical' ? 'Crítico' : d.severity === 'moderate' ? 'Moderado' : 'Normal',
        color: d.severity === 'critical' ? 'text-red-500' : d.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500',
        confidence: d.confidence ?? 0.85
    }))

    // Fallback: extract findings from report if detections is empty
    if (findings.length === 0 && analysis.report.detailedFindings) {
        const findingsText = analysis.report.detailedFindings
        const keywords = [
            { pattern: /cárie|carie/gi, type: 'Cárie', severity: 'moderate' },
            { pattern: /perda óssea|perda ossea|reabsorção óssea/gi, type: 'Perda Óssea', severity: 'moderate' },
            { pattern: /lesão periapical|lesao periapical|radiolúcida periapical/gi, type: 'Lesão Periapical', severity: 'critical' },
            { pattern: /fratura|trinca/gi, type: 'Fratura', severity: 'critical' },
            { pattern: /restauração|restauracao/gi, type: 'Restauração', severity: 'normal' },
            { pattern: /periodontite|doença periodontal/gi, type: 'Periodontite', severity: 'moderate' },
            { pattern: /cisto|quisto/gi, type: 'Lesão Cística', severity: 'critical' },
            { pattern: /tratamento endodôntico|canal radicular/gi, type: 'Tratamento Endodôntico', severity: 'normal' },
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
        const { image, clinicalContext, mode, originalAnalysisSummary, model } = body

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

        if (!process.env.OPENROUTER_API_KEY) {
            console.error('Vision analysis error: OPENROUTER_API_KEY not configured')
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
            analysis = await callVisionRefinement(imageData, originalAnalysisSummary, clinicalContext, modelsToUse)
        } else if (mode === 'quick') {
            console.log('Mode: quick - usando callVisionAI (single-pass)')
            analysis = await callVisionAI(imageData, clinicalContext, modelsToUse)
        } else if (mode === 'preview') {
            console.log('Mode: preview - usando callVisionDetection (detecção rápida)')
            const quickResult = await callVisionDetection(imageData, clinicalContext, modelsToUse)
            const validatedDetections = validateAndMergeDetections(quickResult.quickDetections.map((d, i) => ({
                id: `det-${i}`,
                label: d.label,
                box: d.box,
                confidence: d.confidence,
                severity: d.severity,
                toothNumber: d.toothNumber
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
                    toothNumber: d.toothNumber as string | undefined
                })),
                isPreview: true
            }
            await deductCredits(user.id, modelsToUse[0], 'vision', 'Preview de detecção')
            return Response.json(previewResponse)
        } else {
            console.log('Mode: default (two-stage) - usando callTwoStageVisionAnalysis')
            analysis = await callTwoStageVisionAnalysis(imageData, clinicalContext, modelsToUse)
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
