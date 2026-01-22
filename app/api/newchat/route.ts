/**
 * API Route: New Chat
 * 
 * Rota principal de chat usando Vercel AI SDK com OpenRouter.
 * Endpoint: POST /api/newchat
 */

import { streamText } from 'ai'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'

// Configuração para Edge Runtime (melhor performance)
export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, agentId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Selecionar o agente (default: odonto-gpt)
    const selectedAgentId = agentId || 'odonto-gpt'
    const agentConfig = AGENT_CONFIGS[selectedAgentId] || AGENT_CONFIGS['odonto-gpt']

    // Escolher o modelo com base no agente
    let modelId: string = MODELS.chat
    if (selectedAgentId === 'odonto-research') {
      modelId = MODELS.research
    } else if (agentConfig.model) {
      modelId = agentConfig.model
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = openrouter(modelId) as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    const result = streamText({
      model,
      system: agentConfig.system,
      messages: coreMessages as any,
      tools: agentConfig.tools,
      temperature: 0.1,
      maxOutputTokens: 4000,
      maxSteps: 5,
    })


    // Try alternatives if toDataStreamResponse doesn't exist
    if (typeof result.toDataStreamResponse === 'function') {
      return result.toDataStreamResponse()
    } else if (typeof (result as any).toTextStreamResponse === 'function') {
      return (result as any).toTextStreamResponse()
    } else if (typeof (result as any).toAIStreamResponse === 'function') {
      return (result as any).toAIStreamResponse()
    }

    return new Response('Stream method not found on result object', { status: 500 });
  } catch (error) {
    console.error('[NewChat API Error]', error)

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
