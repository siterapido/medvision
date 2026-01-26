/**
 * API Route: Chat with Blocking UI (Non-Streaming)
 *
 * AI SDK v6 with generateText for complete responses.
 * Endpoint: POST /api/chat
 *
 * ROTA UNIFICADA - Esta e a unica rota de chat do sistema.
 * Inclui: autenticacao, contexto thread-safe, tools com maxSteps.
 */

import {
  generateText,
  convertToModelMessages,
  UIMessage,
  generateId,
  stepCountIs,
} from 'ai'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { getAgentArtifactTools } from '@/lib/ai/tools/artifact-tools'
import { getAgentToolPreset, toolNeedsApproval, TOOL_REGISTRY } from '@/lib/ai/tools/registry'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { runWithContext, createContext, type OdontoContext } from '@/lib/ai/context'
import { sanitizeUIMessages } from '@/lib/ai/sanitize-messages'
import { isCommand, parseCommand, executeCommand } from '@/lib/ai/commands'
import { memoryService, processConversation } from '@/lib/ai/memory'
import { trackAICompletion, trackStep, formatDuration } from '@/lib/ai/analytics'
import { handleAIError } from '@/lib/ai/error-handler'
import { detectIntent, getToolChoice } from '@/lib/ai/intent-detection'

export const maxDuration = 120 // Increased for blocking (non-streaming) responses

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

// Helper to detect if messages contain images
function hasImageContent(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts?.some(
      (p) =>
        p.type === 'file' &&
        typeof (p as any).mediaType === 'string' &&
        (p as any).mediaType.startsWith('image/')
    )
  )
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
    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Chat] Missing Supabase configuration')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[Chat] Missing OpenRouter API key - environment variables:', {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
    const toolPreset = getAgentToolPreset(agentId)

    // Detect images in messages and route to vision model if needed
    const hasImages = hasImageContent(messages)
    const modelId = hasImages
      ? MODELS.vision // Use vision model (Claude 3.5 Sonnet) for image analysis
      : agentConfig.model || 'google/gemini-2.0-flash-001'

    if (hasImages) {
      console.log('[Chat] Detected images, using vision model:', MODELS.vision)
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
        systemPrompt += `\n\nALUNO: ${contextParts.join(', ')}.`
      }

      // 2. Inject Memory Context (minimal)
      if (memoryContext.longTerm.length > 0) {
        const memoryItems = memoryContext.longTerm.slice(0, 3).map(m => m.content).join('; ')
        systemPrompt += `\nMEMORIAS: ${memoryItems}`
      }

      // 3. Inject Episodic Context (minimal)
      if (memoryContext.episodic.length > 0) {
        const episodicItems = memoryContext.episodic.slice(0, 1).map(m => m.content).join('; ')
        systemPrompt += `\nCONTEXTO ANTERIOR: ${episodicItems}`
      }
    }

    // Add artifact generation instructions (minimal)
    systemPrompt += `\n\nARTIFACTS: Use createDocument(kind='summary') quando pedirem resumo/material de estudo. O conteudo aparece em painel separado.`

    // Add vision analysis instructions when images are detected (minimal)
    if (hasImages) {
      systemPrompt += `\n\nIMAGEM DETECTADA: Analise em 2-3 linhas com achado principal. Ofereca laudo completo via artifact se quiser detalhes. Sempre inclua aviso de validacao clinica.`
    }

    // Map agentId to allowed agent_type in DB
    let dbAgentType = 'qa'
    if (agentId === 'odonto-vision') dbAgentType = 'image-analysis'
    else if (['odonto-summary', 'odonto-practice', 'odonto-research'].includes(agentId))
      dbAgentType = 'orchestrated'

    // Create session if needed
    if (!currentSessionId) {
      const lastMsg = messages[messages.length - 1]
      const titleContent = extractTextFromMessage(lastMsg) || 'Nova Conversa'
      const sessionTitle = titleContent.substring(0, 100) || 'Nova Conversa'

      const { data: session } = await adminSupabase
        .from('agent_sessions')
        .insert({
          user_id: currentUserId,
          agent_type: dbAgentType,
          title: sessionTitle,
          metadata: { title: sessionTitle }, // backward compat
        })
        .select()
        .single()

      if (session) {
        currentSessionId = session.id
        console.log('[Chat] Session created:', {
          sessionId: session.id,
          userId: currentUserId,
          title: session.title,
        })
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

    // For now, start simple without extra tools - just use agent config tools
    const tools = agentConfig.tools || {}

    console.log('[Chat] Tools available:', {
      toolCount: Object.keys(tools).length,
      toolNames: Object.keys(tools),
    })

    // Sanitizar mensagens before sending to generateText
    const sanitizedMessages = sanitizeUIMessages(messages)

    // Convert UIMessage to ModelMessage format for generateText
    let modelMessages
    try {
      modelMessages = await convertToModelMessages(sanitizedMessages)
    } catch (conversionError) {
      console.error('[Chat] Error converting messages:', conversionError)
      console.error('[Chat] Sanitized messages:', JSON.stringify(sanitizedMessages, null, 2))
      throw conversionError
    }

    console.log(
      `[Chat] Agent: ${agentId}, Model: ${modelId}, Messages: ${modelMessages.length}, Tools: ${Object.keys(tools).length}, MaxSteps: ${toolPreset.maxSteps}`
    )
    console.log('[Chat] Model messages:', JSON.stringify(modelMessages.slice(-2), null, 2))

    // Detect user intent for tool choice control
    const intent = detectIntent(lastMessageText)
    const toolChoice = getToolChoice(intent)

    if (intent) {
      console.log('[Chat] Intent detected:', {
        tool: intent.tool,
        kind: intent.kind,
        confidence: intent.confidence,
        reason: intent.reason,
        toolChoice: toolChoice.type,
      })
    }

    // Track start time for analytics
    const startTime = Date.now()

    // Use generateText for blocking (non-streaming) response with tools enabled
    const result = await runWithContext(odontoContext, async () => {
      return await generateText({
        model: openrouter(modelId),
        system: systemPrompt,
        messages: modelMessages,
        tools, // ✅ Tools enabled
        toolChoice, // ✅ Tool choice based on intent detection
        maxSteps: toolPreset.maxSteps, // ✅ Multi-step execution
        temperature: 0.4,
        maxOutputTokens: 1500,
        abortSignal: req.signal,

        // ✅ Track step progress (server-side logging)
        onStepFinish: async ({ stepType, toolCalls, toolResults, usage }) => {
          trackStep({
            stepType,
            toolCalls,
            toolResults,
            usage,
          })
        },

        // ✅ Enable telemetry for observability
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'odonto-chat',
          metadata: {
            agentId,
            userId: currentUserId,
            sessionId: currentSessionId,
          },
        },
      })
    })

    const duration = Date.now() - startTime

    // Track completion metrics
    trackAICompletion({
      agentId,
      modelId,
      tokens: {
        prompt: result.usage.promptTokens,
        completion: result.usage.completionTokens,
        total: result.usage.totalTokens,
      },
      toolsUsed: result.toolResults?.map(tr => tr.toolName) || [],
      duration,
      success: true,
      artifactType: result.toolResults?.[0]?.result?.kind,
      sessionId: currentSessionId,
      userId: currentUserId,
    })

    console.log(`[Chat] Generation finished in ${formatDuration(duration)}, saving to DB...`)

    // Build assistant response message
    const assistantMessage: UIMessage = {
      id: generateId(),
      role: 'assistant',
      parts: [{ type: 'text', text: result.text }],
    }

    // Save assistant message to database
    if (currentSessionId && result.text) {
      await adminSupabase.from('agent_messages').insert({
        session_id: currentSessionId,
        agent_id: agentId,
        role: 'assistant',
        content: result.text,
      })

      // Extract and save facts from conversation (async)
      const userMessageText = extractTextFromMessage(messages[messages.length - 1])
      processConversation(
        currentUserId!,
        currentSessionId,
        userMessageText,
        result.text
      ).catch(err => console.error('[Chat] Error extracting facts:', err))

      // Increment conversation count for progressive setup
      memoryService.incrementConversationCount(currentUserId!)
        .catch(err => console.error('[Chat] Error incrementing count:', err))
    }

    // Return JSON response with the complete message
    return Response.json({
      message: assistantMessage,
      sessionId: currentSessionId,
      usage: result.usage,
      toolResults: result.toolResults,
    })
  } catch (error) {
    // Use typed error handler
    const handled = handleAIError(error)

    console.error('[Chat API Error]', {
      type: handled.type,
      message: handled.message,
      statusCode: handled.statusCode,
      userId: currentUserId,
      sessionId: currentSessionId,
      details: handled.details,
    })

    // Send structured error response
    return new Response(
      JSON.stringify({
        error: handled.message,
        type: handled.type,
        details: process.env.NODE_ENV === 'development' ? handled.details : undefined,
      }),
      {
        status: handled.statusCode || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
