
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { generateObject } from 'ai'
import { z } from 'zod'

export const maxDuration = 60 // 60 seconds

const VisionSchema = z.object({
    meta: z.object({
        imageType: z.enum(['Periapical', 'Panorâmica', 'Interproximal (Bitewing)', 'Oclusal', 'Foto Intraoral', 'Tomografia', 'Desconhecido']).describe("Tipo da imagem odontológica."),
        quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe("Qualidade técnica da imagem para fins diagnósticos."),
        notes: z.string().optional().describe("Notas sobre a qualidade técnica (ex: 'Sobreposição', 'Distorção', 'Baixo contraste').")
    }),
    detections: z.array(z.object({
        label: z.string().describe("Nome curto da patologia ou estrutura identificada (ex: 'Cárie', 'Perda Óssea')."),
        box: z.array(z.number()).length(4).describe("Coordenadas [ymin, xmin, ymax, xmax] normalizadas de 0 a 100."),
        severity: z.enum(['critical', 'moderate', 'normal']).describe("Nível de severidade do achado."),
        description: z.string().optional().describe("Breve descrição técnica do achado.")
    })),
    report: z.object({
        technicalAnalysis: z.string().describe("Texto detalhando a qualidade técnica e estruturas visíveis."),
        detailedFindings: z.string().describe("Descrição minuciosa de todos os achados, dividido por região ou dente quando aplicável."),
        diagnosticHypothesis: z.string().describe("Hipóteses diagnósticas principais baseadas nos achados de imagem."),
        recommendations: z.array(z.string()).describe("Lista numerada de sugestões de conduta clínica e exames complementares.")
    })
})

export async function POST(req: Request) {
    try {
        const { image } = await req.json()

        if (!image) {
            return new Response(JSON.stringify({ error: 'Image data is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Keep the full data URL - AI SDK with OpenAI-compatible providers needs this format
        // If it's already base64 without prefix, add it
        let imageData = image
        if (!image.startsWith('data:') && !image.startsWith('http')) {
            // Assume it's raw base64, add JPEG prefix (most common for compressed images)
            imageData = `data:image/jpeg;base64,${image}`
        }

        // Validate that we have a valid OpenRouter API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('Vision analysis error: OPENROUTER_API_KEY not configured')
            return new Response(JSON.stringify({ error: 'API not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const result = await generateObject({
            model: openrouter(MODELS.vision),
            schema: VisionSchema,
            messages: [
                {
                    role: 'system' as const,
                    content: `Você é o OdontoAI Vision, um radiologista e estomatologista renomado.
Sua tarefa é analisar imagens odontológicas e gerar um LAUDO TÉCNICO PROFISSIONAL COMPLETO.

DIRETRIZES DE ANÁLISE:
1. Classifique o tipo da imagem e sua qualidade técnica.
2. Identifique anomalias como: Cáries (classe/profundidade), Doença Periodontal (nível ósseo), Lesões Periapicais, Anomalias Dentárias, Restaurações (adaptação), Endodontia.
3. Use terminologia técnica correta (ex: "imagem radiolúcida", "reabsorção óssea horizontal", "lesão sugestiva de...").

SOBRE AS COORDENADAS (BOX):
- Identifique visualmente as lesões principais para desenhar os "boxes".
- Coordenadas normalizadas [ymin, xmin, ymax, xmax] de 0 a 100.

IDIOMA: Português do Brasil (pt-BR) formal.`
                },
                {
                    role: 'user' as const,
                    content: [
                        { type: 'text' as const, text: 'GERE UM LAUDO RADIOGRÁFICO DETALHADO E ANALISE ESTA IMAGEM.' },
                        { type: 'image' as const, image: imageData }
                    ]
                }
            ]
        })

        const analysis = result.object

        // Processar para o formato do frontend
        const responseData = {
            meta: analysis.meta,
            detections: analysis.detections.map((d, i) => ({
                id: `det-${i}`,
                label: d.label,
                confidence: 0.95,
                box: {
                    ymin: d.box[0],
                    xmin: d.box[1],
                    ymax: d.box[2],
                    xmax: d.box[3]
                },
                severity: d.severity,
                description: d.description
            })),
            report: analysis.report,
            findings: analysis.detections.map(d => ({
                type: d.label,
                zone: d.description ? d.description.slice(0, 30) + '...' : 'Região Identificada',
                level: d.severity === 'critical' ? 'Crítico' : d.severity === 'moderate' ? 'Moderado' : 'Normal',
                color: d.severity === 'critical' ? 'text-red-500' : d.severity === 'moderate' ? 'text-amber-500' : 'text-blue-500'
            }))
        }

        return Response.json(responseData)
    } catch (error: unknown) {
        console.error('Vision analysis error:', error)

        // Provide more detailed error message
        let errorMessage = 'Failed to analyze image'
        let statusCode = 500
        let errorDetails = ''

        if (error instanceof Error) {
            errorDetails = error.message
            // Check for common error types
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

        // Log full error for debugging
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
