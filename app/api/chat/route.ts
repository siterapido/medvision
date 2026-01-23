/**
 * API Route: Chat with Artifacts Support
 *
 * Usa AI SDK v6 com streamText e tool calling para gerar artifacts.
 * Endpoint: POST /api/chat
 */

import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentArtifactTools } from '@/lib/ai/tools/artifact-tools'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to extract text from UIMessage parts
function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts) return ''
  for (const part of message.parts) {
    if ('text' in part && typeof part.text === 'string') {
      return part.text
    }
  }
  return JSON.stringify(message.parts)
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      agentId = 'odonto-gpt',
      sessionId,
      userId,
    }: {
      messages: UIMessage[]
      agentId: string
      sessionId?: string
      userId?: string
    } = await req.json()

    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']
    const modelId = agentConfig.model || 'google/gemini-2.0-flash-001'

    // Get artifact tools for this agent
    const artifactTools = getAgentArtifactTools(agentId)

    // Combine base tools with artifact tools
    const tools = {
      ...agentConfig.tools,
      ...artifactTools,
    }

    // --- CONTEXT INJECTION & SETUP MODE ---
    let systemPrompt = agentConfig.system

    if (userId) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        // 1. Inject Context
        const contextParts = []
        if (profile.university) contextParts.push(`Universidade: ${profile.university}`)
        if (profile.semester) contextParts.push(`Semestre/Fase: ${profile.semester}`)
        if (profile.level) contextParts.push(`Nível: ${profile.level}`)
        if (profile.specialty_interest) contextParts.push(`Interesse: ${profile.specialty_interest}`)

        if (contextParts.length > 0) {
          systemPrompt += `\n\n# CONTEXTO DO ALUNO (PRIORITÁRIO)\n${contextParts.join('\n')}\nAdapte sua linguagem e profundidade para este perfil.`
        }

        // 2. Setup Mode Trigger
        if (agentId === 'odonto-gpt' && (!profile.semester || !profile.university)) {
          systemPrompt += `\n\n# MODO SETUP ATIVO (MISSING INFO)\nVocê percebeu que não sabe o semestre ou universidade do aluno.\nNo início da sua resposta, pergunte casualmente: "A propósito, em que semestre e faculdade você está? Assim posso calibrar melhor as explicações."\nUse a ferramenta \`updateUserProfile\` assim que ele responder.`
        }
      }
    }

    // Add artifact generation instructions
    systemPrompt += `\n\n# GERAÇÃO DE ARTIFACTS
Quando o aluno pedir materiais de estudo, você DEVE usar as ferramentas de artifact disponíveis:
- createSummary: Para criar resumos estruturados
- createFlashcards: Para criar decks de flashcards
- createQuiz: Para criar simulados e quizzes
- createResearch: Para criar dossiês de pesquisa
- createReport: Para criar laudos de análise de imagem

IMPORTANTE: Sempre que gerar um artifact, informe o aluno que o material foi criado e aparecerá no chat.`

    // Map agentId to allowed agent_type in DB
    let dbAgentType = 'qa'
    if (agentId === 'odonto-vision') dbAgentType = 'image-analysis'
    else if (['odonto-summary', 'odonto-practice', 'odonto-research'].includes(agentId))
      dbAgentType = 'orchestrated'

    let currentSessionId = sessionId

    // Create session if needed
    if (!currentSessionId && userId) {
      const lastMsg = messages[messages.length - 1]
      const titleContent = extractTextFromMessage(lastMsg) || 'Nova Conversa'

      const { data: session } = await supabase
        .from('agent_sessions')
        .insert({
          user_id: userId,
          agent_type: dbAgentType,
          metadata: { title: titleContent.substring(0, 50) },
        })
        .select()
        .single()

      if (session) {
        currentSessionId = session.id
      }
    }

    // Save User Message
    if (currentSessionId) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'user') {
        const contentStr = extractTextFromMessage(lastMsg)

        await supabase.from('agent_messages').insert({
          session_id: currentSessionId,
          agent_id: agentId,
          role: 'user',
          content: contentStr,
        })
      }
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages)

    console.log(
      `[Chat] Agent: ${agentId}, Model: ${modelId}, Messages: ${modelMessages.length}, Tools: ${Object.keys(tools).length}`
    )

    const result = streamText({
      model: openrouter(modelId) as any,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      maxSteps: 5,
      temperature: 0.1,
      maxTokens: 4000,
      onFinish: async (event) => {
        if (currentSessionId) {
          await supabase.from('agent_messages').insert({
            session_id: currentSessionId,
            agent_id: agentId,
            role: 'assistant',
            content: event.text,
            tool_calls: event.toolCalls as any,
          })
        }
        console.log(
          `[Chat] Finished: ${event.finishReason}, Tokens: ${event.usage?.totalTokens || 'N/A'}`
        )
      },
    })

    return result.toUIMessageStreamResponse({
      headers: {
        'x-session-id': currentSessionId || '',
      },
    })
  } catch (error) {
    console.error('[Chat API Error]', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
