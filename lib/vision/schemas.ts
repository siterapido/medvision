import { z } from 'zod'

const imageTypeEnum = z.enum([
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
    'Desconhecido',
])

/** Bounding box normalizado [ymin, xmin, ymax, xmax] 0–100 (compartilhado estágio 1 e 2). */
export const box4 = z
    .array(z.number().min(0).max(100))
    .length(4)
    .transform((b) => [
        Math.min(b[0], b[2]),
        Math.min(b[1], b[3]),
        Math.max(b[0], b[2]),
        Math.max(b[1], b[3]),
    ])

export const DetectionSchema = z.object({
    label: z
        .string()
        .describe(
            "Nome curto do achado radiológico (ex: 'Opacidade', 'Nódulo Pulmonar', 'Fratura', 'Derrame Pleural').",
        ),
    box: box4.describe(
        'Coordenadas [ymin, xmin, ymax, xmax] normalizadas 0–100. ymin < ymax e xmin < xmax. Área mínima do achado.',
    ),
    severity: z.enum(['critical', 'moderate', 'normal']).describe('Nível de severidade do achado.'),
    confidence: z.number().min(0).max(1).describe('Grau de confiança do achado de 0 a 1, refletindo a certeza diagnóstica.'),
    description: z.string().optional().describe('Breve descrição técnica do achado (1-2 frases).'),
    detailedDescription: z.string().optional().describe('Descrição técnica detalhada do achado (3-5 frases) com terminologia especializada.'),
    anatomicalRegion: z
        .string()
        .optional()
        .describe(
            "Região anatômica do achado usando topografia precisa (ex: 'Lobo superior direito', 'Hemitórax esquerdo', 'Fêmur distal', 'Hipocôndrio direito'). Omita se não identificável.",
        ),
    cidCode: z
        .string()
        .optional()
        .describe(
            "Código CID-10 correspondente ao achado (ex: 'J18.9' para pneumonia, 'S72.0' para fratura de fêmur, 'J90' para derrame pleural).",
        ),
    differentialDiagnosis: z.array(z.string()).optional().describe('Lista de 2-3 diagnósticos diferenciais para este achado específico.'),
    clinicalSignificance: z
        .enum(['alta', 'media', 'baixa'])
        .optional()
        .describe(
            'Significância clínica do achado: alta (requer ação imediata), media (monitorar/tratar em breve), baixa (acompanhamento de rotina).',
        ),
    recommendedActions: z
        .array(z.string())
        .optional()
        .describe(
            "Lista de 1-3 ações recomendadas específicas para ESTE achado (ex: 'TC de tórax com contraste', 'Broncoscopia', 'Ortopedia urgente').",
        ),
    detectionType: z
        .enum([
            'opacity',
            'consolidation',
            'nodule',
            'mass',
            'fracture',
            'effusion',
            'pneumothorax',
            'cardiomegaly',
            'lymphadenopathy',
            'calcification',
            'atelectasis',
            'infiltrate',
            'foreign_body',
            'cyst',
            'tumor',
            'anomaly',
            'other',
        ])
        .optional()
        .describe('Tipo de achado radiológico para classificação.'),
    radiologyData: z
        .object({
            pattern: z.string().optional().describe("Padrão radiológico (ex: 'alveolar', 'intersticial', 'nodular', 'consolidativo', 'cavitário')."),
            distribution: z.string().optional().describe("Distribuição na imagem (ex: 'difuso', 'focal', 'bilateral', 'unilateral', 'lobar', 'segmentar')."),
            margins: z.enum(['bem_definidas', 'mal_definidas', 'espiculadas', 'lobuladas']).optional().describe('Característica das margens do achado.'),
            density: z.enum(['hipodenso', 'isodenso', 'hiperdenso', 'heterogeneo']).optional().describe('Densidade do achado em TC (Hounsfield).'),
        })
        .optional()
        .describe('Dados radiológicos gerais do achado.'),
    fractureData: z
        .object({
            location: z.string().optional().describe("Localização anatômica da fratura (ex: 'diáfise', 'epífise', 'arco costal', 'corpo vertebral')."),
            direction: z.enum(['transversa', 'obliqua', 'espiral', 'cominutiva', 'compressao']).optional().describe('Padrão morfológico da fratura.'),
            displacement: z.boolean().optional().describe('Se há desvio/deslocamento dos fragmentos.'),
            alignment: z.string().optional().describe('Alinhamento dos fragmentos.'),
        })
        .optional()
        .describe('Dados específicos para fraturas ósseas.'),
})

const metaFull = z.object({
    imageType: imageTypeEnum.describe('Tipo do exame de imagem (radiografia 2D, tomografia ou outro).'),
    quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe('Qualidade técnica da imagem para fins diagnósticos.'),
    qualityScore: z.number().min(0).max(100).describe('Pontuação de qualidade de 0 a 100 para fins de cálculo de precisão.'),
    notes: z.string().optional().describe("Notas sobre a qualidade técnica (ex: 'Rotação', 'Subexposto', 'Artefato de movimento')."),
})

const metaQuick = z.object({
    imageType: imageTypeEnum.describe('Tipo do exame de imagem (radiografia 2D, tomografia ou outro).'),
    quality: z.enum(['Excelente', 'Boa', 'Aceitável', 'Ruim', 'Inadequada']).describe('Qualidade técnica da imagem.'),
    qualityScore: z.number().min(0).max(100),
})

export const VisionSchema = z.object({
    meta: metaFull,
    detections: z.array(DetectionSchema),
    report: z.object({
        technicalAnalysis: z.string().describe('Texto detalhando a qualidade técnica e estruturas visíveis, usando terminologia radiológica precisa.'),
        detailedFindings: z.string().describe('Descrição minuciosa de todos os achados, dividido por região ou dente (em notação FDI) quando aplicável.'),
        diagnosticHypothesis: z.string().describe('Hipóteses diagnósticas principais baseadas nos achados de imagem, com grau de certeza.'),
        recommendations: z.array(z.string()).describe('Lista numerada de sugestões de conduta clínica e exames complementares.'),
        perToothBreakdown: z
            .array(
                z.object({
                    tooth: z.string().describe("Número do dente em notação FDI (ex: '26') ou região (ex: 'Região anterior mandibular')."),
                    findings: z.string().describe('Resumo dos achados para este dente/região.'),
                    cidCode: z.string().optional().describe('Código CID-10 principal para este dente/região.'),
                    severity: z.enum(['critical', 'moderate', 'normal']).optional().describe('Severidade geral para este dente/região.'),
                }),
            )
            .optional()
            .describe('Breakdown dos achados por dente (notação FDI) ou região anatômica.'),
        differentialDiagnosis: z.string().optional().describe('Discussão detalhada dos diagnósticos diferenciais mais relevantes para os principais achados encontrados.'),
    }),
})

export const QuickDetectionSchema = z.object({
    meta: metaQuick,
    quickDetections: z
        .array(
            z.object({
                label: z.string().describe("Nome curto do achado radiológico (ex: 'Opacidade', 'Nódulo', 'Fratura', 'Derrame Pleural')."),
                box: box4.describe('Coordenadas [ymin, xmin, ymax, xmax] normalizadas 0–100.'),
                severity: z.enum(['critical', 'moderate', 'normal']),
                confidence: z.number().min(0).max(1),
                anatomicalRegion: z
                    .string()
                    .optional()
                    .describe("Região anatômica do achado usando topografia precisa (ex: 'Lobo superior direito', 'Hemitórax esquerdo')."),
            }),
        )
        .describe('Lista de achados radiológicos detectados na imagem.'),
})

export const DetailedDetectionSchema = z.object({
    detailedAnalysis: z
        .array(
            z.object({
                originalIndex: z.number().describe('Índice da detecção original (0, 1, 2...)'),
                label: z.string(),
                anatomicalRegion: z.string().optional().describe('Região anatômica precisa do achado.'),
                cidCode: z.string().optional().describe('Código CID-10 principal para o achado.'),
                radiologyData: z
                    .object({
                        pattern: z.string().optional().describe("Padrão radiológico (ex: 'alveolar', 'intersticial', 'nodular')."),
                        distribution: z.string().optional().describe("Distribuição (ex: 'lobar', 'bilateral', 'focal')."),
                        margins: z.enum(['bem_definidas', 'mal_definidas', 'espiculadas', 'lobuladas']).optional(),
                        density: z.enum(['hipodenso', 'isodenso', 'hiperdenso', 'heterogeneo']).optional(),
                    })
                    .optional()
                    .describe('Características radiológicas do achado.'),
                differentialDiagnosis: z.array(z.string()).describe('2-3 diagnósticos diferenciais para este achado.'),
                clinicalSignificance: z.enum(['alta', 'media', 'baixa']).describe('Significância clínica.'),
                recommendedActions: z.array(z.string()).describe('Ações clínicas recomendadas específicas.'),
                detailedDescription: z.string().describe('Descrição técnica detalhada (3-5 frases).'),
                description: z.string().optional().describe('Breve descrição (1-2 frases).'),
            }),
        )
        .describe('Análise detalhada para cada detecção do Estágio 1.'),
})

export type VisionAnalysis = z.infer<typeof VisionSchema>
