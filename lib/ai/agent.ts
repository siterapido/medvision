/**
 * Agente de IA para processamento síncrono de mensagens
 *
 * Utilizado para integrações que não suportam streaming (ex: WhatsApp via Z-API)
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { AGENT_CONFIGS, getAgentConfig } from './agents/config'
import { MODELS } from './openrouter'

// Configure OpenAI provider for OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OdontoGPT WhatsApp',
  }
})

/**
 * Contexto do usuário para personalização de respostas
 */
export interface UserContext {
  name?: string | null
  planType?: string | null
  trialDaysLeft?: number | null
  pipelineStage?: string | null
}

/**
 * Processa uma mensagem de forma síncrona (sem streaming)
 * Ideal para integrações como WhatsApp onde streaming não é suportado
 *
 * @param message - A mensagem do usuário
 * @param phone - Número de telefone do usuário (para contexto/logging)
 * @param agentId - ID do agente a ser usado (padrão: odonto-gpt)
 * @returns A resposta gerada pelo agente
 */
export async function processMessageSync(
  message: string,
  phone: string,
  agentId: string = 'odonto-gpt'
): Promise<string> {
  try {
    const agentConfig = getAgentConfig(agentId)

    console.log(`[Agent] Processing message from ${phone} with agent ${agentId}`)

    // Sistema prompt adaptado para WhatsApp (mais conciso)
    const whatsappSystemPrompt = `${agentConfig.system}

IMPORTANTE: Você está respondendo via WhatsApp. Mantenha suas respostas concisas e bem formatadas para leitura em dispositivos móveis. Evite respostas muito longas.`

    const result = await generateText({
      model: openrouter(agentConfig.model || MODELS.chat),
      system: whatsappSystemPrompt,
      messages: [
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      maxTokens: 1000, // Limitar para WhatsApp
    })

    console.log(`[Agent] Response generated for ${phone}, length: ${result.text.length}`)

    return result.text
  } catch (error) {
    console.error('[Agent] Error processing message:', error)

    // Mensagem de erro amigável para o usuário
    return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. 🙏'
  }
}

/**
 * Processa uma mensagem com histórico de conversa
 *
 * @param messages - Array de mensagens anteriores
 * @param phone - Número de telefone do usuário
 * @param agentId - ID do agente a ser usado
 * @param userContext - Contexto do usuário para personalização
 * @returns A resposta gerada pelo agente
 */
export async function processConversationSync(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  phone: string,
  agentId: string = 'odonto-gpt',
  userContext?: UserContext
): Promise<string> {
  try {
    const agentConfig = getAgentConfig(agentId)

    console.log(`[Agent] Processing conversation from ${phone}, messages: ${messages.length}`)

    // Construir contexto personalizado se disponível
    let contextInfo = ''
    if (userContext) {
      const parts: string[] = []
      if (userContext.name) {
        parts.push(`O usuário se chama ${userContext.name}`)
      }
      if (userContext.planType) {
        parts.push(`Plano: ${userContext.planType}`)
      }
      if (userContext.trialDaysLeft !== null && userContext.trialDaysLeft !== undefined) {
        if (userContext.trialDaysLeft <= 0) {
          parts.push('O trial expirou')
        } else if (userContext.trialDaysLeft <= 3) {
          parts.push(`Restam ${userContext.trialDaysLeft} dias de trial`)
        }
      }
      if (parts.length > 0) {
        contextInfo = `\n\nCONTEXTO DO USUÁRIO: ${parts.join('. ')}.`
      }
    }

    const whatsappSystemPrompt = `${agentConfig.system}

IMPORTANTE: Você está respondendo via WhatsApp. Mantenha suas respostas concisas e bem formatadas para leitura em dispositivos móveis.${contextInfo}`

    const result = await generateText({
      model: openrouter(agentConfig.model || MODELS.chat),
      system: whatsappSystemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.text
  } catch (error) {
    console.error('[Agent] Error processing conversation:', error)
    return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente. 🙏'
  }
}
