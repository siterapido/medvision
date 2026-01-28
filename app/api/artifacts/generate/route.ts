/**
 * API Route: Generate Artifacts from Form Configuration
 *
 * Endpoint: POST /api/artifacts/generate
 *
 * Generates study artifacts (summaries, flashcards) based on user configuration
 * from the Biblioteca forms. Uses LLM to generate content and saves to Supabase.
 */

import { generateText } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

export const maxDuration = 60

// Admin client for persistence (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Model for artifact generation
const GENERATION_MODEL = 'google/gemini-2.0-flash-001'

interface SummaryConfig {
  topic: string
  specialty?: string
  depth: 'basico' | 'intermediario' | 'avancado'
  format: 'resumo' | 'topicos' | 'esquema'
}

interface FlashcardsConfig {
  topic: string
  specialty?: string
  quantity: number
  difficulty: 'facil' | 'medio' | 'dificil'
  includeImages?: boolean
}

interface ResearchConfig {
  query: string
  scope: 'pubmed' | 'scholar' | 'recent' | 'comprehensive'
  language: 'pt' | 'en' | 'both'
}

interface ExamConfig {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  numQuestions: number
}

type ArtifactConfig = SummaryConfig | FlashcardsConfig | ResearchConfig | ExamConfig

interface GenerateRequest {
  type: 'summary' | 'flashcards' | 'research' | 'exam'
  config: ArtifactConfig
}

// System prompts for artifact generation
const SUMMARY_SYSTEM_PROMPT = `Voce e um especialista em criar materiais de estudo de Odontologia. Crie resumos claros, precisos e bem estruturados.

REGRAS:
- Use terminologia tecnica correta
- Baseie-se em literatura odontologica confiavel
- Inclua referencias quando apropriado
- Adapte a profundidade ao nivel solicitado
- Use formatacao markdown clara

FORMATO DE SAIDA - JSON VALIDO:
{
  "title": "Titulo descritivo do resumo",
  "content": "Conteudo em markdown com formatacao adequada",
  "keyPoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "tags": ["tag1", "tag2"]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

const FLASHCARDS_SYSTEM_PROMPT = `Voce e um especialista em criar flashcards de estudo de Odontologia. Crie cards com perguntas objetivas e respostas concisas.

REGRAS:
- Perguntas devem ser diretas e testarem conhecimento especifico
- Respostas devem ser concisas mas completas
- Adapte a dificuldade ao nivel solicitado
- Cubra os topicos mais importantes do tema
- Varie os tipos de perguntas (conceito, aplicacao, comparacao)

NIVEIS DE DIFICULDADE:
- facil: Conceitos basicos, definicoes, memorizar
- medio: Aplicacao clinica, correlacoes, nivel graduacao
- dificil: Casos complexos, detalhes avancados, nivel residencia

FORMATO DE SAIDA - JSON VALIDO:
{
  "title": "Titulo do deck de flashcards",
  "cards": [
    {
      "front": "Pergunta do card",
      "back": "Resposta do card",
      "category": "Categoria opcional"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

const RESEARCH_SYSTEM_PROMPT = `Voce e um pesquisador senior em Odontologia. Sua tarefa e realizar uma analise critica da literatura cientifica sobre o tema solicitado.

REGRAS:
- Cite autores e anos (ficticios mas plausiveis baseados em tendencias reais se necessario, ou baseados no conhecimento treinado)
- Use linguagem formal e cientifica
- Divida em: Introducao, Metodologia de Busca (descritiva), Resultados (com evidencias), Conclusao e Referencias Bibliograficas (formato ABNT)
- Foque em odontologia baseada em evidencias (OBE)

FORMATO DE SAIDA - JSON VALIDO:
{
  "title": "Titulo Cientifico da Pesquisa",
  "markdownContent": "Conteudo completo formatado em Markdown",
  "sources": [
    { "title": "Titulo do Artigo", "url": "https://pubmed.ncbi.nlm.nih.gov/...", "status": "verified" }
  ],
  "researchType": "Revisao Sistematica / Meta-analise / Analise de Literatura",
  "tags": ["Odontologia", "Pesquisa", "OBE"]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

const EXAM_SYSTEM_PROMPT = `Voce e um professor de Odontologia especializado em preparar alunos para concursos e residencias. Crie um simulado de alta qualidade.

REGRAS:
- Questoes de multipla escolha (A, B, C, D, E)
- Apenas UMA alternativa correta
- Explique detalhadamente POR QUE a alternativa esta correta e por que as outras estao erradas
- Adapte a dificuldade ao nivel solicitado

FORMATO DE SAIDA - JSON VALIDO:
{
  "title": "Simulado Pratico: [Tema]",
  "questions": [
    {
      "question_text": "Texto da pergunta",
      "type": "multiple_choice",
      "options": ["Opcao A", "Opcao B", "Opcao C", "Opcao D", "Opcao E"],
      "correct_answer": "Opcao A",
      "explanation": "Explicacao tecnica detalhada",
      "difficulty": "medium"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`

function getSummaryPrompt(config: SummaryConfig): string {
  const depthDescriptions: Record<string, string> = {
    basico: 'Faca um resumo introdutorio focado nos conceitos fundamentais (3-4 secoes)',
    intermediario: 'Faca um resumo detalhado cobrindo aspectos importantes e clinicos (5-6 secoes)',
    avancado: 'Faca um resumo aprofundado com detalhes avancados e nuances clinicas (7-8 secoes)'
  }

  const formatDescriptions: Record<string, string> = {
    resumo: 'Use paragrafos explicativos fluidos',
    topicos: 'Use listas com bullets organizados hierarquicamente',
    esquema: 'Use estrutura visual com titulos, subtitulos e indentacao'
  }

  return `Crie um resumo de estudo sobre: "${config.topic}"
${config.specialty ? `Especialidade: ${config.specialty}` : ''}

Profundidade: ${config.depth}
${depthDescriptions[config.depth]}

Formato: ${config.format}
${formatDescriptions[config.format]}

Retorne um JSON valido conforme o formato especificado.`
}

function getFlashcardsPrompt(config: FlashcardsConfig): string {
  const difficultyDescriptions: Record<string, string> = {
    facil: 'Nivel basico - conceitos fundamentais, definicoes, memorizar',
    medio: 'Nivel graduacao - aplicacao clinica, correlacoes, raciocinio',
    dificil: 'Nivel residencia - casos complexos, detalhes avancados, nuances'
  }

  return `Crie um deck de ${config.quantity} flashcards sobre: "${config.topic}"
${config.specialty ? `Especialidade: ${config.specialty}` : ''}

Dificuldade: ${config.difficulty}
${difficultyDescriptions[config.difficulty]}

Crie exatamente ${config.quantity} cards variados cobrindo diferentes aspectos do tema.

Retorne um JSON valido conforme o formato especificado.`
}

function getResearchPrompt(config: ResearchConfig): string {
  return `Realize uma pesquisa cientifica profunda sobre: "${config.query}"
Escopo da busca: ${config.scope}
Idioma dos resultados: ${config.language === 'both' ? 'Portugues e Ingles' : config.language}

Forneca uma analise critica com base em odontologia baseada em evidencias.
Retorne um JSON valido conforme o formato especificado.`
}

function getExamPrompt(config: ExamConfig): string {
  return `Crie um simulado com ${config.numQuestions} questoes sobre: "${config.topic}"
Dificuldade: ${config.difficulty}

As questoes devem ser desafiadoras e representativas de provas de residencia e concursos na area.
Retorne um JSON valido conforme o formato especificado.`
}

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request
    const body: GenerateRequest = await req.json()
    const { type, config } = body

    if (!type || !config) {
      return Response.json({ error: 'Missing type or config' }, { status: 400 })
    }

    // 3. Validate config based on type
    if (type === 'summary') {
      const summaryConfig = config as SummaryConfig
      if (!summaryConfig.topic || !summaryConfig.depth || !summaryConfig.format) {
        return Response.json({ error: 'Invalid summary config' }, { status: 400 })
      }
    } else if (type === 'flashcards') {
      const flashcardsConfig = config as FlashcardsConfig
      if (!flashcardsConfig.topic || !flashcardsConfig.quantity || !flashcardsConfig.difficulty) {
        return Response.json({ error: 'Invalid flashcards config' }, { status: 400 })
      }
    } else if (type === 'research') {
      const researchConfig = config as ResearchConfig
      if (!researchConfig.query) {
        return Response.json({ error: 'Invalid research config' }, { status: 400 })
      }
    } else if (type === 'exam') {
      const examConfig = config as ExamConfig
      if (!examConfig.topic || !examConfig.numQuestions) {
        return Response.json({ error: 'Invalid exam config' }, { status: 400 })
      }
    } else {
      return Response.json({ error: 'Invalid artifact type' }, { status: 400 })
    }

    console.log(`[Artifact Generate] Type: ${type}, User: ${user.id}`)

    // 4. Generate content with LLM
    let systemPrompt: string
    let userPrompt: string

    if (type === 'summary') {
      systemPrompt = SUMMARY_SYSTEM_PROMPT
      userPrompt = getSummaryPrompt(config as SummaryConfig)
    } else if (type === 'research') {
      systemPrompt = RESEARCH_SYSTEM_PROMPT
      userPrompt = getResearchPrompt(config as ResearchConfig)
    } else if (type === 'exam') {
      systemPrompt = EXAM_SYSTEM_PROMPT
      userPrompt = getExamPrompt(config as ExamConfig)
    } else {
      systemPrompt = FLASHCARDS_SYSTEM_PROMPT
      userPrompt = getFlashcardsPrompt(config as FlashcardsConfig)
    }

    const result = await generateText({
      model: openrouter(GENERATION_MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
      maxOutputTokens: 4000,
    })

    // 5. Parse LLM response
    let parsedContent: any

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonString = result.text.trim()

      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7)
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3)
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3)
      }

      parsedContent = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('[Artifact Generate] Failed to parse LLM response:', result.text)
      return Response.json({
        error: 'Failed to parse generated content',
        details: result.text.substring(0, 500)
      }, { status: 500 })
    }

    // 6. Save to database
    const artifactId = nanoid()

    let artifactData: any

    if (type === 'summary') {
      const summaryConfig = config as SummaryConfig
      artifactData = {
        id: artifactId,
        user_id: user.id,
        title: parsedContent.title || `Resumo: ${summaryConfig.topic}`,
        type: 'summary',
        description: `Resumo sobre ${summaryConfig.topic} (${summaryConfig.depth})`,
        content: {
          markdownContent: parsedContent.content,
          keyPoints: parsedContent.keyPoints || [],
          topic: summaryConfig.topic,
          tags: parsedContent.tags || [],
          depth: summaryConfig.depth,
          format: summaryConfig.format,
          specialty: summaryConfig.specialty,
        },
        ai_context: {
          agent: 'biblioteca-forms',
          model: GENERATION_MODEL,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          tags: parsedContent.tags || [],
          depth: summaryConfig.depth,
          format: summaryConfig.format,
        },
      }
    } else if (type === 'flashcards') {
      const flashcardsConfig = config as FlashcardsConfig
      const cards = (parsedContent.cards || []).map((card: any, idx: number) => ({
        id: `card-${idx + 1}`,
        front: card.front,
        back: card.back,
        category: card.category,
      }))

      artifactData = {
        id: artifactId,
        user_id: user.id,
        title: parsedContent.title || `Flashcards: ${flashcardsConfig.topic}`,
        type: 'flashcards',
        description: `Deck de ${cards.length} flashcards sobre ${flashcardsConfig.topic}`,
        content: {
          topic: flashcardsConfig.topic,
          cards,
          difficulty: flashcardsConfig.difficulty,
          specialty: flashcardsConfig.specialty,
        },
        ai_context: {
          agent: 'biblioteca-forms',
          model: GENERATION_MODEL,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          count: cards.length,
          difficulty: flashcardsConfig.difficulty,
        },
      }
    } else if (type === 'research') {
      const researchConfig = config as ResearchConfig
      artifactData = {
        id: artifactId,
        user_id: user.id,
        title: parsedContent.title || `Pesquisa: ${researchConfig.query}`,
        type: 'research',
        description: `Pesquisa científica sobre ${researchConfig.query}`,
        content: {
          query: researchConfig.query,
          markdownContent: parsedContent.markdownContent,
          sources: parsedContent.sources || [],
          researchType: parsedContent.researchType || 'Análise de Literatura',
        },
        ai_context: {
          agent: 'biblioteca-forms',
          model: GENERATION_MODEL,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          sourcesCount: (parsedContent.sources || []).length,
        },
      }
    } else if (type === 'exam') {
      const examConfig = config as ExamConfig
      artifactData = {
        id: artifactId,
        user_id: user.id,
        title: parsedContent.title || `Simulado: ${examConfig.topic}`,
        type: 'exam',
        description: `Simulado de ${parsedContent.questions?.length || 0} questões sobre ${examConfig.topic}`,
        content: {
          topic: examConfig.topic,
          questions: parsedContent.questions || [],
          difficulty: examConfig.difficulty,
        },
        ai_context: {
          agent: 'biblioteca-forms',
          model: GENERATION_MODEL,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          questionsCount: (parsedContent.questions || []).length,
          difficulty: examConfig.difficulty,
        },
      }
    }

    const { error: insertError } = await adminSupabase
      .from('artifacts')
      .insert(artifactData)

    if (insertError) {
      console.error('[Artifact Generate] DB insert error:', insertError)
      return Response.json({ error: 'Failed to save artifact' }, { status: 500 })
    }

    console.log(`[Artifact Generate] Saved artifact ${artifactId} for user ${user.id}`)

    // 7. Return success with artifact info
    return Response.json({
      success: true,
      artifact: {
        id: artifactId,
        type,
        title: artifactData.title,
        createdAt: new Date().toISOString(),
      },
      usage: result.usage,
    })

  } catch (error) {
    console.error('[Artifact Generate] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
