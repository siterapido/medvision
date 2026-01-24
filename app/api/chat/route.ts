/**
 * API Route: Chat with Streaming + Tool Approval
 *
 * AI SDK v6 with streamText, toUIMessageStreamResponse, and tool approval flow.
 * Endpoint: POST /api/chat
 *
 * ROTA UNIFICADA - Esta e a unica rota de chat do sistema.
 * Inclui: autenticacao, contexto thread-safe, streaming, tool approval.
 */

import {
  streamText,
  convertToModelMessages,
  UIMessage,
  generateId,
  consumeStream,
} from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentArtifactTools } from '@/lib/ai/tools/artifact-tools'
import { getAgentToolPreset, toolNeedsApproval } from '@/lib/ai/tools/registry'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { runWithContext, createContext, type OdontoContext } from '@/lib/ai/context'
import { sanitizeUIMessages } from '@/lib/ai/sanitize-messages'
import { isCommand, parseCommand, executeCommand } from '@/lib/ai/commands'
import { memoryService, processConversation } from '@/lib/ai/memory'

export const maxDuration = 60

// Admin client para operacoes de persistencia (bypassa RLS)
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

/**
 * Extrai informacoes pessoais da mensagem e salva na memoria automaticamente.
 */
async function extractAndSavePersonalInfo(
  userId: string,
  sessionId: string | undefined,
  messageText: string
): Promise<void> {
  const infoToSave: Array<{ content: string; topic: string }> = []

  // Padroes para nome
  const namePatterns = [
    /(?:meu nome [eé]|me chamo|sou (?:o |a )?|pode me chamar de) (\w+)/i,
    /(?:oi|ol[aá]|hey),? (?:eu )?sou (?:o |a )?(\w+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = messageText.match(pattern)
    if (match && match[1] && match[1].length > 1) {
      const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
      infoToSave.push({
        content: `O nome do aluno e ${name}`,
        topic: 'nome',
      })
      break
    }
  }

  // Padroes para universidade
  const universityPatterns = [
    /(?:estudo|fa[çc]o|curso) (?:na|no|em) (\w+(?:\s+\w+){0,3})/i,
    /(?:sou d[ao]|sou alun[oa] d[ao]) (\w+(?:\s+\w+){0,3})/i,
    /(?:minha (?:faculdade|universidade) [eé]) (\w+(?:\s+\w+){0,3})/i,
  ]

  for (const pattern of universityPatterns) {
    const match = messageText.match(pattern)
    if (match && match[1] && match[1].length > 2) {
      infoToSave.push({
        content: `O aluno estuda na ${match[1]}`,
        topic: 'universidade',
      })
      break
    }
  }

  // Padroes para semestre
  const semesterPatterns = [
    /(?:estou no|to no|curso o) (\d+)[ºo°]?\s*(?:semestre|periodo)/i,
    /(\d+)[ºo°]?\s*(?:semestre|periodo)/i,
  ]

  for (const pattern of semesterPatterns) {
    const match = messageText.match(pattern)
    if (match && match[1]) {
      infoToSave.push({
        content: `O aluno esta no ${match[1]}o semestre`,
        topic: 'semestre',
      })
      break
    }
  }

  // Salvar cada informacao detectada
  for (const info of infoToSave) {
    try {
      await memoryService.saveMemory({
        userId,
        agentId: 'odonto-gpt',
        type: 'long_term',
        content: info.content,
        topic: info.topic,
        confidence: 1.0,
        sessionId,
        metadata: {
          source: 'extraction',
          importance: 'high',
        },
      })
      console.log(`[Chat] Auto-saved memory: ${info.topic} - ${info.content}`)
    } catch (err) {
      console.error(`[Chat] Error auto-saving memory:`, err)
    }
  }
}

export async function POST(req: Request) {
  let currentUserId: string | null = null
  let currentSessionId: string | undefined

  try {
    // 1. AUTENTICACAO - Verificar sessao do usuario
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

    // Parse request body
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

    currentSessionId = sessionId

    // Normalize to messages array
    const messages: UIMessage[] = messagesArray || (message ? [message] : [])

    // Get last message text for command detection
    const lastMessage = messages[messages.length - 1]
    const lastMessageText = extractTextFromMessage(lastMessage)

    // ============================================
    // COMMAND HANDLING - Intercept slash commands
    // ============================================
    if (lastMessage?.role === 'user' && isCommand(lastMessageText)) {
      const parsed = parseCommand(lastMessageText)

      if (parsed) {
        const commandResult = await executeCommand(
          parsed.command,
          parsed.args,
          currentUserId,
          sessionId
        )

        // If command should skip AI, return the command result directly
        if (commandResult.skipAI) {
          const commandResponse: UIMessage = {
            id: generateId(),
            role: 'assistant',
            parts: [{ type: 'text', text: commandResult.message }],
          }

          return new Response(JSON.stringify({
            message: commandResponse,
            sessionId: sessionId || null,
            isCommand: true,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // If command has followUp, replace the user message with followUp prompt
        if (commandResult.followUp) {
          const modifiedMessages = [...messages.slice(0, -1), {
            ...lastMessage,
            parts: [{ type: 'text' as const, text: commandResult.followUp }],
          }]
          messages.splice(0, messages.length, ...modifiedMessages)
        }
      }
    }

    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']
    const modelId = agentConfig.model || 'google/gemini-2.0-flash-001'
    const toolPreset = getAgentToolPreset(agentId)

    // Get artifact tools for this agent
    const artifactTools = getAgentArtifactTools(agentId)

    // Combine base tools with artifact tools
    const tools = {
      ...agentConfig.tools,
      ...artifactTools,
    }

    // --- CONTEXT INJECTION WITH MEMORY SYSTEM ---
    let systemPrompt = agentConfig.system
    let userProfile: {
      name?: string
      email?: string
      profession?: string
      cro?: string
      university?: string
      semester?: string
      specialty_interest?: string
      level?: string
      response_preference?: string
    } | null = null

    // Fetch user memory context (includes profile and relevant memories via hybrid search)
    const userQuery = extractTextFromMessage(messages[messages.length - 1])
    const memoryContext = await memoryService.getUserContext(currentUserId, userQuery)

    // Fetch user profile usando admin client (bypassa RLS)
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (profile) {
      userProfile = profile

      // 1. Inject Profile Context
      const contextParts = []
      if (profile.name) contextParts.push(`Nome: ${profile.name}`)
      if (profile.profession) contextParts.push(`Profissao: ${profile.profession}`)
      if (profile.cro) contextParts.push(`CRO: ${profile.cro}`)
      if (profile.university) contextParts.push(`Universidade: ${profile.university}`)
      if (profile.semester) contextParts.push(`Semestre/Fase: ${profile.semester}`)
      if (profile.level) contextParts.push(`Nivel: ${profile.level}`)
      if (profile.specialty_interest) contextParts.push(`Interesse: ${profile.specialty_interest}`)
      if (profile.response_preference) contextParts.push(`Preferencia de Resposta: ${profile.response_preference}`)

      if (contextParts.length > 0) {
        const greeting = profile.name ? `O nome do aluno e ${profile.name}. ` : ''
        systemPrompt += `\n\n# CONTEXTO DO ALUNO (PRIORITARIO)\n${greeting}${contextParts.join('\n')}\nAdapte sua linguagem e profundidade para este perfil. Use o nome do aluno para personalizar as respostas.`
      }

      // 2. Inject Memory Context (from hybrid search)
      if (memoryContext.longTerm.length > 0) {
        const memoryItems = memoryContext.longTerm
          .slice(0, 5)
          .map(m => `- ${m.content}${m.topic ? ` (${m.topic})` : ''}`)
          .join('\n')
        systemPrompt += `\n\n# MEMORIAS RELEVANTES DO ALUNO\n${memoryItems}`
      }

      // 3. Inject Episodic Context (recent conversation summaries)
      if (memoryContext.episodic.length > 0) {
        const episodicItems = memoryContext.episodic
          .slice(0, 2)
          .map(m => `- ${m.content}`)
          .join('\n')
        systemPrompt += `\n\n# CONVERSAS ANTERIORES\n${episodicItems}`
      }
    }

    // Add artifact generation instructions
    systemPrompt += `\n\n# GERACAO DE ARTIFACTS
Quando o aluno pedir materiais de estudo, voce DEVE usar as ferramentas de artifact disponiveis:
- createSummary: Para criar resumos estruturados
- createFlashcards: Para criar decks de flashcards
- createQuiz: Para criar simulados e quizzes
- createResearch: Para criar dossies de pesquisa
- createReport: Para criar laudos de analise de imagem

IMPORTANTE: Sempre que gerar um artifact, informe o aluno que o material foi criado e aparecera no chat.`

    // Map agentId to allowed agent_type in DB
    let dbAgentType = 'qa'
    if (agentId === 'odonto-vision') dbAgentType = 'image-analysis'
    else if (['odonto-summary', 'odonto-practice', 'odonto-research'].includes(agentId))
      dbAgentType = 'orchestrated'

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

        // MEMORY: Auto-extract personal info from message
        extractAndSavePersonalInfo(currentUserId, currentSessionId, contentStr)
          .catch(err => console.error('[Chat] Error in auto-extraction:', err))
      }
    }

    // Create context for tool execution
    const odontoContext: OdontoContext = createContext({
      userId: currentUserId,
      sessionId: currentSessionId || '',
      userProfile: {
        name: userProfile?.name,
        email: userProfile?.email,
        profession: userProfile?.profession,
        cro: userProfile?.cro,
        university: userProfile?.university,
        semester: userProfile?.semester,
        specialty: userProfile?.specialty_interest,
        level: userProfile?.level,
      },
      permissions: ['read', 'write', 'create_artifacts'],
      agentId,
      metadata: {},
    })

    // Sanitizar mensagens antes de converter (AI SDK v6 fix)
    const sanitizedMessages = sanitizeUIMessages(messages)

    if (sanitizedMessages.length !== messages.length) {
      console.warn(
        `[Chat] Sanitizacao removeu ${messages.length - sanitizedMessages.length} mensagens invalidas`
      )
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(sanitizedMessages)

    console.log(
      `[Chat] Agent: ${agentId}, Model: ${modelId}, Messages: ${modelMessages.length}, Tools: ${Object.keys(tools).length}, MaxSteps: ${toolPreset.maxSteps}`
    )

    // Use streamText with AsyncLocalStorage context
    const result = await runWithContext(odontoContext, async () => {
      return streamText({
        model: openrouter(modelId) as any,
        system: systemPrompt,
        messages: modelMessages,
        tools,
        maxSteps: toolPreset.maxSteps,
        temperature: 0.1,
        maxTokens: 4000,
        abortSignal: req.signal,

        // Tool approval flow - check if tool needs approval
        experimental_prepareStep: async ({ toolCalls }) => {
          // Mark tools that need approval
          const toolsNeedingApproval = toolCalls
            .filter(tc => toolNeedsApproval(tc.toolName))
            .map(tc => tc.toolName)

          if (toolsNeedingApproval.length > 0) {
            console.log(`[Chat] Tools requiring approval: ${toolsNeedingApproval.join(', ')}`)
          }

          // Return undefined to continue, or return { skipToolExecution: true } to require approval
          // For now, we allow execution but tools will be marked in the UI
          return undefined
        },

        // Called when each step finishes
        onStepFinish: async ({ stepType, text, toolCalls, toolResults }) => {
          if (stepType === 'tool-result' && toolResults && toolResults.length > 0) {
            console.log(`[Chat] Tool results:`, toolResults.map(tr => tr.toolName).join(', '))
          }
        },
      })
    })

    // Return streaming response with proper callbacks
    return result.toUIMessageStreamResponse({
      sendStart: true,
      sendFinish: true,
      consumeSseStream: consumeStream, // Enables proper abort handling

      onFinish: async ({ text, finishReason, usage, isAborted }) => {
        if (isAborted) {
          console.log('[Chat] Stream was aborted by client')
          return
        }

        console.log(
          `[Chat] Finished: ${finishReason}, Tokens: ${usage?.totalTokens || 'N/A'}`
        )

        // Persist assistant message
        if (currentSessionId && text) {
          try {
            await adminSupabase.from('agent_messages').insert({
              session_id: currentSessionId,
              agent_id: agentId,
              role: 'assistant',
              content: text,
            })

            // Extract and save facts from conversation (async)
            const userMessageText = extractTextFromMessage(messages[messages.length - 1])
            processConversation(
              currentUserId!,
              currentSessionId,
              userMessageText,
              text
            ).catch(err => console.error('[Chat] Error extracting facts:', err))

            // Increment conversation count for progressive setup
            memoryService.incrementConversationCount(currentUserId!)
              .catch(err => console.error('[Chat] Error incrementing count:', err))
          } catch (err) {
            console.error('[Chat] Error persisting message:', err)
          }
        }
      },

      onError: (error) => {
        console.error('[Chat] Stream error:', error)
        return 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
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
