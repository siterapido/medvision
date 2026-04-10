/**
 * Fact Extractor for Memory System
 *
 * Uses AI to extract important facts and entities from conversations
 * that should be remembered for future interactions.
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { ExtractedFact, SessionSummary } from './types'
import { memoryService } from './service'

// OpenRouter client for extraction
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Use a fast, cheap model for extraction
const EXTRACTION_MODEL = 'google/gemini-2.0-flash-001'

/**
 * Extract facts from a conversation exchange
 */
export async function extractFacts(
  userMessage: string,
  assistantMessage: string,
  existingContext?: string
): Promise<ExtractedFact[]> {
  try {
    const result = await generateText({
      model: openrouter(EXTRACTION_MODEL) as any,
      temperature: 0.1,
      maxTokens: 1000,
      system: `Voce e um extrator de fatos para um tutor de odontologia.
Sua tarefa e identificar informacoes IMPORTANTES sobre o ALUNO que devem ser lembradas para futuras conversas.

TIPOS DE FATOS A EXTRAIR:
1. Informacoes academicas (universidade, semestre, curso)
2. Areas de interesse ou especialidade
3. Dificuldades ou duvidas recorrentes
4. Preferencias de estudo
5. Topicos ja dominados ou estudados
6. Objetivos profissionais

NAO EXTRAIR:
- Perguntas gerais sobre odontologia
- Informacoes clinicas de pacientes
- Fatos ja conhecidos do contexto

FORMATO DE RESPOSTA (JSON):
{
  "facts": [
    {
      "content": "descricao do fato",
      "type": "fact" ou "long_term",
      "topic": "topico relacionado (opcional)",
      "confidence": 0.0 a 1.0,
      "entities": ["entidade1", "entidade2"]
    }
  ]
}

Se nao houver fatos relevantes, retorne: { "facts": [] }`,
      messages: [
        {
          role: 'user',
          content: `${existingContext ? `CONTEXTO EXISTENTE:\n${existingContext}\n\n` : ''}MENSAGEM DO ALUNO:\n${userMessage}\n\nRESPOSTA DO TUTOR:\n${assistantMessage}`,
        },
      ],
    } as any)

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return []
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.facts || []
  } catch (error) {
    console.error('[Extractor] Error extracting facts:', error)
    return []
  }
}

/**
 * Summarize a conversation session for episodic memory
 */
export async function summarizeSession(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  sessionId: string
): Promise<SessionSummary | null> {
  if (messages.length < 4) {
    // Skip very short conversations
    return null
  }

  try {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.content}`)
      .join('\n\n')

    const result = await generateText({
      model: openrouter(EXTRACTION_MODEL) as any,
      temperature: 0.1,
      maxTokens: 500,
      system: `Voce deve resumir uma conversa de tutoria em odontologia.

FORMATO DE RESPOSTA (JSON):
{
  "summary": "Resumo de 2-3 frases da conversa",
  "topics": ["topico1", "topico2"],
  "keyPoints": ["ponto chave 1", "ponto chave 2"],
  "questionsAsked": ["pergunta do aluno 1"]
}`,
      messages: [
        {
          role: 'user',
          content: `CONVERSA:\n${conversationText}`,
        },
      ],
    } as any)

    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      sessionId,
      userId,
      summary: parsed.summary || 'Conversa sobre odontologia',
      topics: parsed.topics || [],
      keyPoints: parsed.keyPoints || [],
      questionsAsked: parsed.questionsAsked || [],
    }
  } catch (error) {
    console.error('[Extractor] Error summarizing session:', error)
    return null
  }
}

/**
 * Process a conversation and save extracted memories
 */
export async function processConversation(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
  existingContext?: string
): Promise<void> {
  try {
    // Extract facts
    const facts = await extractFacts(userMessage, assistantMessage, existingContext)

    // Save each extracted fact as a memory
    for (const fact of facts) {
      if (fact.confidence >= 0.7) {
        await memoryService.saveMemory({
          userId,
          agentId: 'medvision',
          type: fact.type,
          content: fact.content,
          topic: fact.topic,
          confidence: fact.confidence,
          sessionId,
          metadata: {
            source: 'extraction',
            entities: fact.entities,
          },
        })
      }
    }

    console.log(`[Extractor] Extracted ${facts.length} facts from conversation`)
  } catch (error) {
    console.error('[Extractor] Error processing conversation:', error)
  }
}

/**
 * Process end of session and create episodic memory
 */
export async function processSessionEnd(
  userId: string,
  sessionId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  try {
    const summary = await summarizeSession(messages, userId, sessionId)

    if (summary) {
      await memoryService.saveEpisodicMemory(
        userId,
        sessionId,
        summary.summary,
        summary.topics
      )

      console.log(`[Extractor] Created episodic memory for session ${sessionId}`)
    }
  } catch (error) {
    console.error('[Extractor] Error processing session end:', error)
  }
}

/**
 * Classify user query type for hybrid response mode
 */
export async function classifyQueryType(
  query: string
): Promise<'factual' | 'conceptual' | 'clinical' | 'unknown'> {
  try {
    const result = await generateText({
      model: openrouter(EXTRACTION_MODEL) as any,
      temperature: 0,
      maxTokens: 50,
      system: `Classifique a pergunta em uma das categorias:
- FACTUAL: Perguntas diretas sobre doses, nomes, datas (ex: "Qual a dose de amoxicilina?")
- CONCEPTUAL: Perguntas sobre "por que", "como funciona" (ex: "Por que usamos antibiotico?")
- CLINICAL: Casos clinicos, diagnosticos, tratamentos (ex: "Paciente com dor no 46...")

Responda APENAS com uma palavra: FACTUAL, CONCEPTUAL ou CLINICAL`,
      messages: [{ role: 'user', content: query }],
    } as any)

    const type = result.text.trim().toUpperCase()
    if (type === 'FACTUAL') return 'factual'
    if (type === 'CONCEPTUAL') return 'conceptual'
    if (type === 'CLINICAL') return 'clinical'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
