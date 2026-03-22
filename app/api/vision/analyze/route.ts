
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { generateText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 120 // 120 seconds — allow larger images

// Rate limits per plan
const RATE_LIMITS: Record<string, number> = {
    trial: 5,
    free: 5,
    pro: 200,
    admin: 9999,
}
const DEFAULT_LIMIT = 5

const VisionSchema = z.object({
    meta: z.object({
        imageType: z.enum(['Periapical', 'Panorâmica', 'Interproximal (Bitewing)', 'Oclusal', 'Foto Intraoral', 'Tomografia', 'Desconhecido']).describe("Tipo da imagem odontológica."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem para fins diagnósticos."),
        qualityScore: z.number().min(0).max(100).describe("Pontuação de qualidade de 0 a 100 para fins de cálculo de precisão."),
        notes: z.string().optional().describe("Notas sobre a qualidade técnica (ex: 'Sobreposição', 'Distorção', 'Baixo contraste').")
    }),
    detections: z.array(z.object({
        label: z.string().describe("Nome curto da patologia ou estrutura identificada (ex: 'Cárie', 'Perda Óssea')."),
        box: z.array(z.number()).length(4).describe("Coordenadas PRECISAS [ymin, xmin, ymax, xmax] normalizadas de 0 a 100, delimitando exatamente a área do achado. Use valores decimais para maior precisão."),
        severity: z.enum(['critical', 'moderate', 'normal']).describe("Nível de severidade do achado."),
        confidence: z.number().min(0).max(1).describe("Grau de confiança do achado de 0 a 1, refletindo a certeza diagnóstica."),
        description: z.string().optional().describe("Breve descrição técnica do achado.")
    })),
    report: z.object({
        technicalAnalysis: z.string().describe("Texto detalhando a qualidade técnica e estruturas visíveis."),
        detailedFindings: z.string().describe("Descrição minuciosa de todos os achados, dividido por região ou dente quando aplicável."),
        diagnosticHypothesis: z.string().describe("Hipóteses diagnósticas principais baseadas nos achados de imagem."),
        recommendations: z.array(z.string()).describe("Lista numerada de sugestões de conduta clínica e exames complementares.")
    })
})

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
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

async function callVisionAI(imageData: string, clinicalContext?: string, attempt = 1): Promise<z.infer<typeof VisionSchema>> {
    const maxAttempts = 3

    const contextSection = clinicalContext?.trim()
        ? `\n\nCONTEXTO CLÍNICO FORNECIDO PELO PROFISSIONAL:\n${clinicalContext.trim()}\n\nConsidere este contexto ao formular hipóteses diagnósticas e recomendações.`
        : ''

    const jsonSchema = `{
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
      "description": string (opcional)
    }
  ],
  "report": {
    "technicalAnalysis": string,
    "detailedFindings": string,
    "diagnosticHypothesis": string,
    "recommendations": [string]
  }
}`

    try {
        const result = await generateText({
            model: openrouter(MODELS.vision),
            messages: [
                {
                    role: 'system' as const,
                    content: `Você é o OdontoAI Vision, um radiologista e estomatologista renomado.
Sua tarefa é analisar imagens odontológicas e gerar um LAUDO TÉCNICO PROFISSIONAL COMPLETO.

DIRETRIZES DE ANÁLISE:
1. Classifique o tipo da imagem e sua qualidade técnica (atribua um qualityScore de 0-100).
2. Identifique anomalias como: Cáries (classe/profundidade), Doença Periodontal (nível ósseo), Lesões Periapicais, Anomalias Dentárias, Restaurações (adaptação), Endodontia.
3. Use terminologia técnica correta (ex: "imagem radiolúcida", "reabsorção óssea horizontal", "lesão sugestiva de...").
4. Para cada achado, atribua um valor de confidence (0-1) refletindo sua certeza diagnóstica baseada na qualidade da imagem.

REGRA DE FLEXIBILIDADE: Mesmo que a imagem seja de baixa qualidade, SEMPRE tente gerar achados e laudo. Se a qualidade for ruim, reduza o confidence dos achados proporcionalmente e indique isso no laudo. Nunca recuse analisar uma imagem.

SOBRE AS COORDENADAS (BOX) - EXTREMAMENTE IMPORTANTE:
- SEMPRE gere detections para cada achado identificado na imagem.
- Para cada patologia ou achado encontrado, OBRIGATORIAMENTE crie uma entrada em detections.
- As coordenadas [ymin, xmin, ymax, xmax] devem ser o mais PRECISAS possível, delimitando EXATAMENTE a área do achado na imagem.
- Analise cuidadosamente a posição exata de cada achado antes de definir as coordenadas.
- O bounding box deve ser JUSTO ao redor do achado — não use áreas grandes demais que cubram regiões sem achados.
- Para dentes individuais, o box deve cobrir apenas aquele dente específico, não o quadrante inteiro.
- Para lesões periapicais, o box deve cobrir a lesão e o ápice do dente envolvido, não a mandíbula inteira.
- Se houver múltiplos achados próximos, crie detections SEPARADAS com boxes individuais para cada um.
- Use valores decimais quando necessário (ex: 23.5 em vez de arredondar para 24) para maior precisão.
- Para tomografias com múltiplos cortes, identifique achados em cada corte visível e agrupe por região anatômica.
- Em último caso, se realmente não for possível localizar com precisão, use coordenadas da região geral, mas PREFIRA SEMPRE ser preciso.

REGRA CRÍTICA: Se você descrever um achado no report, DEVE existir uma entrada correspondente em detections.${contextSection}

IDIOMA: Português do Brasil (pt-BR) formal.

FORMATO DE RESPOSTA: Responda SOMENTE com JSON válido seguindo este schema exato:
${jsonSchema}

NÃO inclua markdown, code blocks, ou texto fora do JSON.`
                },
                {
                    role: 'user' as const,
                    content: [
                        { type: 'text' as const, text: 'GERE UM LAUDO RADIOGRÁFICO DETALHADO E ANALISE ESTA IMAGEM. Para cada achado, forneça coordenadas de bounding box PRECISAS e JUSTAS ao redor da área exata do achado — evite boxes grandes demais. Responda SOMENTE com o JSON.' },
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })

        // Extract JSON from the response text
        let jsonText = result.text.trim()

        // Remove markdown code block if present
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '')
        }

        const parsed = JSON.parse(jsonText)
        const validated = VisionSchema.parse(parsed)
        return validated
    } catch (error) {
        const isRetryable = error instanceof Error && (
            error.message.includes('timeout') ||
            error.message.includes('network') ||
            error.message.includes('503') ||
            error.message.includes('502') ||
            error.message.includes('500') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('fetch failed') ||
            error instanceof SyntaxError || // JSON parse failure
            error.name === 'ZodError' // Schema validation failure
        )

        if (isRetryable && attempt < maxAttempts) {
            console.warn(`Vision API attempt ${attempt} failed, retrying in ${attempt * 1500}ms...`, error)
            await sleep(attempt * 1500)
            return callVisionAI(imageData, clinicalContext, attempt + 1)
        }

        throw error
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

        // --- Rate limiting ---
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type, role')
            .eq('id', user.id)
            .single()

        const planType = profile?.plan_type ?? 'trial'
        const role = profile?.role ?? 'user'
        const dailyLimit = role === 'admin' ? RATE_LIMITS.admin : (RATE_LIMITS[planType] ?? DEFAULT_LIMIT)

        if (dailyLimit < 9999) {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)

            const { count } = await supabase
                .from('artifacts')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', 'vision')
                .gte('created_at', todayStart.toISOString())

            const usedToday = count ?? 0
            if (usedToday >= dailyLimit) {
                return new Response(JSON.stringify({
                    error: `Limite diário de ${dailyLimit} análises atingido para o plano ${planType}. Tente novamente amanhã ou faça upgrade para Pro.`,
                    code: 'RATE_LIMIT_EXCEEDED',
                    limit: dailyLimit,
                    used: usedToday
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                })
            }
        }

        // --- Parse body ---
        const { image, clinicalContext } = await req.json()

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

        // --- Call AI ---
        const analysis = await callVisionAI(imageData, clinicalContext)

        // Calculate overall precision score
        const qualityScore = analysis.meta.qualityScore
        const avgDetectionConfidence = analysis.detections.length > 0
            ? analysis.detections.reduce((sum, d) => sum + (d.confidence ?? 0.8), 0) / analysis.detections.length
            : 0.8
        const overallPrecision = Math.round((qualityScore * 0.4 + avgDetectionConfidence * 100 * 0.6))

        const detections = analysis.detections.map((d, i) => {
            const boxWidth = d.box[3] - d.box[1]
            const boxHeight = d.box[2] - d.box[0]
            let confidence = d.confidence ?? 0.85

            // Penalize oversized boxes (likely imprecise coordinates)
            if (boxWidth > 50 && boxHeight > 50) {
                console.warn(`Detection "${d.label}" has oversized box (${boxWidth.toFixed(1)}x${boxHeight.toFixed(1)}%), reducing confidence`)
                confidence = Math.max(0.1, confidence * 0.8)
            }

            return {
                id: `det-${i}`,
                label: d.label,
                confidence,
                box: {
                    ymin: d.box[0],
                    xmin: d.box[1],
                    ymax: d.box[2],
                    xmax: d.box[3]
                },
                severity: d.severity,
                description: d.description
            }
        })

        let findings = analysis.detections.map(d => ({
            type: d.label,
            zone: d.description ? d.description.slice(0, 50) : 'Região Identificada',
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

        const responseData = {
            meta: analysis.meta,
            detections,
            report: analysis.report,
            findings,
            precision: overallPrecision
        }

        return Response.json(responseData)
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
