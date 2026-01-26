/**
 * Structured Generation - generateObject wrapper for guaranteed valid artifacts
 *
 * Uses AI SDK's generateObject to ensure 100% schema-compliant outputs.
 * This eliminates JSON parsing errors and validates structure at generation time.
 */

import { generateObject } from 'ai'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import {
  GENERATION_SCHEMAS,
  type GenerationKind,
  type GeneratedData,
} from '@/lib/ai/artifacts/generation-schemas'

/**
 * Generate a structured artifact using generateObject
 *
 * @param kind - Type of artifact to generate
 * @param prompt - Generation prompt (user intent + context)
 * @param options - Optional generation parameters
 * @returns Validated artifact data matching the schema
 */
export async function generateStructuredArtifact<K extends GenerationKind>(
  kind: K,
  prompt: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<GeneratedData<K>> {
  const schema = GENERATION_SCHEMAS[kind]

  if (!schema) {
    throw new Error(`No schema found for artifact kind: ${kind}`)
  }

  const {
    model = MODELS.default,
    temperature = 0.7,
    maxTokens = 4000,
  } = options

  console.log(`[Structured Generation] Generating ${kind} artifact...`)

  try {
    const { object } = await generateObject({
      model: openrouter(model),
      schema,
      prompt,
      temperature,
      maxTokens,
      // Timeout de 45s para evitar travamento em geracoes longas
      abortSignal: AbortSignal.timeout(45000),
    })

    console.log(`[Structured Generation] ✓ ${kind} artifact generated successfully`)

    return object as GeneratedData<K>
  } catch (error) {
    console.error(`[Structured Generation] ✗ Failed to generate ${kind}:`, error)
    throw error
  }
}

/**
 * Build prompt for artifact generation
 *
 * Combines user intent with artifact-specific instructions.
 *
 * @param kind - Type of artifact
 * @param topic - Main topic/subject
 * @param params - Additional parameters (context, user preferences, etc.)
 * @returns Formatted prompt for generateObject
 */
export function buildArtifactPrompt(
  kind: GenerationKind,
  topic: string,
  params: {
    context?: string
    userLevel?: string
    additionalInstructions?: string
  } = {}
): string {
  const { context, userLevel, additionalInstructions } = params

  const kindInstructions: Record<GenerationKind, string> = {
    summary: `Crie um resumo completo e estruturado sobre: ${topic}

O resumo deve:
- Ser claro e objetivo
- Usar markdown para formatação (títulos, listas, ênfases)
- Ter 3-7 pontos-chave principais
- Ser adequado para revisão antes de provas
${userLevel ? `- Considerar nível do estudante: ${userLevel}` : ''}

${context ? `Contexto adicional:\n${context}\n` : ''}`,

    flashcards: `Crie um deck de flashcards sobre: ${topic}

Os flashcards devem:
- Ter 5-20 cartões
- Frente: pergunta clara ou termo
- Verso: resposta completa ou definição
- Cobrir conceitos importantes do tema
${userLevel ? `- Adequar dificuldade ao nível: ${userLevel}` : ''}

${context ? `Contexto adicional:\n${context}\n` : ''}`,

    quiz: `Crie um quiz/simulado sobre: ${topic}

O quiz deve:
- Ter 5-15 questões de múltipla escolha
- 5 alternativas por questão (A-E)
- Apenas 1 resposta correta por questão
- Incluir explicação da resposta correta
- Simular formato de provas odontológicas
${userLevel ? `- Adequar dificuldade ao nível: ${userLevel}` : ''}

${context ? `Contexto adicional:\n${context}\n` : ''}`,

    research: `Crie um dossiê de pesquisa sobre: ${topic}

O dossiê deve:
- Sintetizar informações de múltiplas fontes
- Incluir 3-10 fontes confiáveis
- Apresentar síntese em markdown
- Focar em evidências científicas
${userLevel ? `- Adequar profundidade ao nível: ${userLevel}` : ''}

${context ? `Contexto/Fontes:\n${context}\n` : ''}`,

    report: `Crie um laudo radiográfico sobre: ${topic}

O laudo deve:
- Ser técnico e estruturado
- Listar achados principais
- Sugerir recomendações clínicas
- Seguir padrões de laudos odontológicos
- Incluir disclaimer sobre limitações de IA

${context ? `Achados da imagem:\n${context}\n` : ''}`,

    code: `Crie código sobre: ${topic}

O código deve:
- Ser limpo e bem documentado
- Incluir comentários explicativos
- Seguir boas práticas

${context ? `Contexto:\n${context}\n` : ''}`,

    text: `Crie um documento de texto sobre: ${topic}

${context ? `Contexto:\n${context}\n` : ''}`,

    diagram: `Crie um diagrama sobre: ${topic}

O diagrama deve:
- Usar sintaxe Mermaid
- Ser claro e bem organizado

${context ? `Contexto:\n${context}\n` : ''}`,
  }

  let prompt = kindInstructions[kind]

  if (additionalInstructions) {
    prompt += `\n\nInstruções adicionais:\n${additionalInstructions}`
  }

  return prompt
}

/**
 * Generate artifact with automatic prompt building
 *
 * Convenience wrapper that builds the prompt and generates the artifact.
 *
 * @param kind - Type of artifact
 * @param topic - Main topic
 * @param params - Generation parameters
 * @returns Validated artifact data
 */
export async function generateArtifact<K extends GenerationKind>(
  kind: K,
  topic: string,
  params: {
    context?: string
    userLevel?: string
    additionalInstructions?: string
    model?: string
    temperature?: number
  } = {}
): Promise<GeneratedData<K>> {
  const prompt = buildArtifactPrompt(kind, topic, params)

  return generateStructuredArtifact(kind, prompt, {
    model: params.model,
    temperature: params.temperature,
  })
}
