/**
 * API Route: Chat with Artifacts Support
 *
 * Usa AI SDK v6 com generateText (bloco) e tool calling para gerar artifacts.
 * Endpoint: POST /api/chat
 *
 * ROTA UNIFICADA - Esta é a única rota de chat do sistema.
 * Inclui: autenticação, contexto, persistência de artifacts.
 */

import { generateText, convertToModelMessages, UIMessage, generateId } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentArtifactTools } from '@/lib/ai/tools/artifact-tools'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { setContext, clearContext, type OdontoContext } from '@/lib/ai/artifacts'
import { sanitizeUIMessages } from '@/lib/ai/sanitize-messages'

export const maxDuration = 60

// Admin client para operações de persistência (bypassa RLS)
const adminSupabase = createClient(
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
  let currentUserId: string | null = null

  try {
    // 1. AUTENTICAÇÃO - Verificar sessão do usuário
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[Chat] Unauthorized request - no valid session')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    currentUserId = user.id

    // Support both 'message' (single) and 'messages' (array) formats
    // Following vercel/ai-chatbot pattern: normal requests send only last message
    const body = await req.json()
    const {
      message,
      messages: messagesArray,
      agentId = 'odonto-gpt',
      sessionId,
    }: {
      message?: UIMessage
      messages?: UIMessage[]
      agentId: string
      sessionId?: string
    } = body

    // Normalize to messages array
    const messages: UIMessage[] = messagesArray || (message ? [message] : [])

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
    let userProfile: { university?: string; semester?: string; specialty_interest?: string; level?: string } | null = null

    // Fetch user profile usando admin client (bypassa RLS)
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (profile) {
      userProfile = profile

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
    if (!currentSessionId) {
      const lastMsg = messages[messages.length - 1]
      const titleContent = extractTextFromMessage(lastMsg) || 'Nova Conversa'

      const { data: session } = await adminSupabase
        .from('agent_sessions')
        .insert({
          user_id: currentUserId,
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

        await adminSupabase.from('agent_messages').insert({
          session_id: currentSessionId,
          agent_id: agentId,
          role: 'user',
          content: contentStr,
        })
      }
    }

    // 2. INICIALIZAR CONTEXTO para as tools
    const odontoContext: OdontoContext = {
      userId: currentUserId,
      sessionId: currentSessionId || '',
      userProfile: {
        university: userProfile?.university,
        semester: userProfile?.semester,
        specialty: userProfile?.specialty_interest,
        level: userProfile?.level,
      },
      permissions: ['read', 'write', 'create_artifacts'],
      agentId,
      metadata: {},
    }
    setContext(odontoContext)

    // Sanitizar mensagens antes de converter (AI SDK v6 fix)
    const sanitizedMessages = sanitizeUIMessages(messages)

    if (sanitizedMessages.length !== messages.length) {
      console.warn(
        `[Chat] Sanitização removeu ${messages.length - sanitizedMessages.length} mensagens inválidas`
      )
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(sanitizedMessages)

    console.log(
      `[Chat] Agent: ${agentId}, Model: ${modelId}, Messages: ${modelMessages.length}, Tools: ${Object.keys(tools).length}`
    )

    // Usar generateText para resposta em bloco (não-streaming)
    const result = await generateText({
      model: openrouter(modelId) as any,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      maxSteps: 5,
      temperature: 0.1,
      maxTokens: 4000,
    })

    // Persistir mensagem do assistente
    if (currentSessionId) {
      await adminSupabase.from('agent_messages').insert({
        session_id: currentSessionId,
        agent_id: agentId,
        role: 'assistant',
        content: result.text,
        tool_calls: result.toolCalls as any,
      })
    }

    // Limpar contexto após conclusão
    clearContext()

    console.log(
      `[Chat] Finished: ${result.finishReason}, Tokens: ${result.usage?.totalTokens || 'N/A'}`
    )

    // Criar mensagem de resposta no formato UIMessage
    const assistantMessage: UIMessage = {
      id: generateId(),
      role: 'assistant',
      parts: [{ type: 'text', text: result.text }],
    }

    // Adicionar tool results se houver
    if (result.toolResults && result.toolResults.length > 0) {
      for (const toolResult of result.toolResults) {
        assistantMessage.parts.push({
          type: `tool-${toolResult.toolName}` as any,
          state: 'output-available',
          output: toolResult.result,
        } as any)
      }
    }

    return new Response(JSON.stringify({
      message: assistantMessage,
      sessionId: currentSessionId,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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

/**
 * DELETE /api/chat?id=xxx
 * Deletes a specific chat session (soft delete)
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('id')

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'Chat ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Soft delete - set status to 'deleted'
    const { error } = await adminSupabase
      .from('agent_sessions')
      .update({ status: 'deleted' })
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Chat API] Delete error:', error)
      return new Response(JSON.stringify({ error: 'Failed to delete chat' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Chat API] Delete error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
