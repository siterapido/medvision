/**
 * API Route: New Chat
 *
 * Compatible with AI SDK v6 useChat hook data stream protocol
 * Endpoint: POST /api/newchat
 */

import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { MODELS } from '@/lib/ai/openrouter'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export const maxDuration = 60
export const runtime = 'edge'

// Configure OpenAI provider for OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OdontoGPT',
  }
})

// Helper to extract text from message (supports UIMessage parts and legacy content)
function extractTextFromMessage(message: any): string {
  if (typeof message.content === 'string' && message.content) {
    return message.content
  }
  if (message.parts && Array.isArray(message.parts)) {
    for (const part of message.parts) {
      if (part.type === 'text' && part.text) {
        return part.text
      }
    }
  }
  return ''
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, agentId } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Selecionar o agente
    const selectedAgentId = agentId || 'odonto-gpt'
    const agentConfig = AGENT_CONFIGS[selectedAgentId] || AGENT_CONFIGS['odonto-gpt']

    console.log(`[Chat] Agent: ${selectedAgentId}, Messages: ${messages.length}`)

    // Usar AI SDK streamText com OpenRouter provider
    const result = streamText({
      model: openrouter(agentConfig.model || MODELS.chat),
      system: agentConfig.system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: extractTextFromMessage(msg)
      })),
      temperature: 0.1,
    })

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('[Chat Stream Error]', error)
        return error instanceof Error ? error.message : 'Erro ao processar resposta'
      }
    })
  } catch (error) {
    console.error('[NewChat API Error]', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
