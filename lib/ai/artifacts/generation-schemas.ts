/**
 * Generation Schemas - Zod schemas for structured output generation
 *
 * These schemas are used with generateObject to ensure 100% valid artifact data.
 * They focus on content structure without UI metadata (stage, progress, etc).
 */

import { z } from 'zod'

/**
 * Summary generation schema
 * Used for course summaries, chapter reviews, and topic explanations
 */
export const summaryGenerationSchema = z.object({
  title: z.string().describe('Titulo claro e descritivo do resumo'),
  topic: z.string().describe('Topico principal do resumo'),
  content: z.string().describe('Conteudo completo em markdown com estrutura clara'),
  keyPoints: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe('Pontos-chave principais (3-7 itens)'),
  tags: z
    .array(z.string())
    .max(5)
    .optional()
    .describe('Tags para categorização'),
})

/**
 * Flashcards generation schema
 * Used for study cards with front/back content
 */
export const flashcardsGenerationSchema = z.object({
  title: z.string().describe('Titulo do deck de flashcards'),
  topic: z.string().describe('Topico do deck'),
  cards: z
    .array(
      z.object({
        front: z.string().describe('Frente do cartao (pergunta ou termo)'),
        back: z.string().describe('Verso do cartao (resposta ou definicao)'),
        category: z.string().optional().describe('Categoria/topico do cartao'),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      })
    )
    .min(5)
    .max(20)
    .describe('Lista de flashcards (5-20 cartoes)'),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Quiz generation schema
 * Used for practice exams and assessments
 */
export const quizGenerationSchema = z.object({
  title: z.string().describe('Titulo do quiz/simulado'),
  topic: z.string().describe('Topico do quiz'),
  specialty: z.string().optional().describe('Especialidade odontologica'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questions: z
    .array(
      z.object({
        text: z.string().describe('Enunciado da questao'),
        options: z
          .array(
            z.object({
              id: z.enum(['A', 'B', 'C', 'D', 'E']).describe('ID da alternativa'),
              text: z.string().describe('Texto da alternativa'),
              isCorrect: z.boolean().describe('Se e a resposta correta'),
            })
          )
          .length(5)
          .describe('Exatamente 5 alternativas (A-E)'),
        explanation: z.string().describe('Explicacao da resposta correta'),
        difficulty: z
          .enum(['easy', 'medium', 'hard'])
          .optional()
          .describe('Nivel de dificuldade'),
      })
    )
    .min(5)
    .max(15)
    .describe('Lista de questoes (5-15 questoes)'),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Research generation schema
 * Used for literature reviews and research dossiers
 */
export const researchGenerationSchema = z.object({
  title: z.string().describe('Titulo da pesquisa'),
  query: z.string().describe('Query de busca original'),
  content: z.string().describe('Sintese da pesquisa em markdown'),
  sources: z
    .array(
      z.object({
        title: z.string().describe('Titulo da fonte'),
        url: z.string().describe('URL da fonte'),
        summary: z.string().max(200).describe('Resumo da fonte (max 200 chars)'),
        authors: z.string().optional(),
        pubdate: z.string().optional(),
        relevance: z.number().min(0).max(1).optional(),
      })
    )
    .min(3)
    .max(10)
    .describe('Fontes citadas (3-10 fontes)'),
  methodology: z.string().optional(),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Report generation schema
 * Used for radiographic reports and image analysis
 */
export const reportGenerationSchema = z.object({
  title: z.string().describe('Titulo do laudo'),
  examType: z.string().describe('Tipo de exame (ex: Radiografia Periapical)'),
  content: z.string().describe('Laudo completo em markdown'),
  findings: z
    .array(z.string())
    .min(1)
    .describe('Achados principais do exame'),
  recommendations: z
    .array(z.string())
    .optional()
    .describe('Recomendacoes clinicas'),
  quality: z
    .object({
      rating: z.enum(['good', 'adequate', 'limited']),
      notes: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Code generation schema
 */
export const codeGenerationSchema = z.object({
  title: z.string().describe('Titulo do codigo'),
  language: z.string().describe('Linguagem de programacao'),
  code: z.string().describe('Codigo fonte'),
  filename: z.string().optional().describe('Nome do arquivo'),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Text generation schema
 */
export const textGenerationSchema = z.object({
  title: z.string().describe('Titulo do documento'),
  content: z.string().describe('Conteudo em texto ou markdown'),
  format: z.enum(['plain', 'markdown', 'html']).default('markdown'),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Diagram generation schema
 */
export const diagramGenerationSchema = z.object({
  title: z.string().describe('Titulo do diagrama'),
  diagramType: z
    .enum(['flowchart', 'sequence', 'mindmap', 'anatomy', 'mermaid'])
    .describe('Tipo de diagrama'),
  mermaidCode: z.string().describe('Codigo Mermaid do diagrama'),
  description: z.string().optional().describe('Descricao do diagrama'),
  tags: z.array(z.string()).max(5).optional(),
})

/**
 * Unified generation schemas registry
 * Maps artifact kind to generation schema
 */
export const GENERATION_SCHEMAS = {
  summary: summaryGenerationSchema,
  flashcards: flashcardsGenerationSchema,
  quiz: quizGenerationSchema,
  research: researchGenerationSchema,
  report: reportGenerationSchema,
  code: codeGenerationSchema,
  text: textGenerationSchema,
  diagram: diagramGenerationSchema,
} as const

export type GenerationSchemas = typeof GENERATION_SCHEMAS
export type GenerationKind = keyof GenerationSchemas
export type GeneratedData<K extends GenerationKind> = z.infer<GenerationSchemas[K]>
