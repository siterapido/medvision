/**
 * API Route: New Chat
 * 
 * Rota principal de chat usando Vercel AI SDK v6 com OpenRouter.
 * Inclui persistência de histórico e memória compartilhada (longa/curta).
 * Endpoint: POST /api/newchat
 */

import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { createClient } from '@/lib/supabase/server'
import { ChatService } from '@/lib/ai/chat-service'

// Configuracao para Edge Runtime (melhor performance)
// Configuracao para Edge Runtime (melhor performance)
// export const runtime = 'edge' // Disabled to fix stability issues
export const maxDuration = 60

// Helper to extract text from UIMessage parts
function extractTextFromMessage(message: any): string {
  if (typeof message.content === 'string' && message.content) return message.content;
  if (!message.parts) return '';
  for (const part of message.parts) {
    if ('text' in part && typeof part.text === 'string') {
      return part.text;
    }
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const { messages, agentId, userId, chatId: incomingChatId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Inicializar Supabase & ChatService
    const supabase = await createClient()
    const chatService = new ChatService(supabase)

    // Selecionar o agente (default: odonto-gpt)
    const selectedAgentId = agentId || 'odonto-gpt'
    const agentConfig = AGENT_CONFIGS[selectedAgentId] || AGENT_CONFIGS['odonto-gpt']
    const modelId = agentConfig.model || MODELS.chat;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = openrouter(modelId) as any

    // 1. Obter Memória/Contexto Relevante
    // Pegar ultima mensagem do usuário para busca vetorial (futura) ou keyword
    // Tratamos apenas mensagens de texto simples por enquanto
    const lastUserMessageNode = messages.slice().reverse().find((m: any) => m.role === 'user')
    const lastUserMessage = lastUserMessageNode ? extractTextFromMessage(lastUserMessageNode) : ""

    let systemContext = agentConfig.system

    // Se tiver user, buscar memoria
    if (userId && typeof lastUserMessage === 'string') {
      try {
        // Buscar memórias relevantes (Fatos, Longo Prazo)
        const memories = await chatService.searchMemories(userId, lastUserMessage, 5)

        const memoryContext = memories && memories.length > 0
          ? `\n\n# MEMÓRIA COMPARTILHADA (Histórico Relevante):\n${memories.map((m: any) => `- ${m.content}`).join('\n')}`
          : ""

        systemContext = `${agentConfig.system}
# CONTEXTO DE SISTEMA
ID DO USUARIO ATUAL: ${userId}
${memoryContext}
IMPORTANTE: 
1. Use as memórias acima para personalizar a resposta.
2. Ao usar ferramentas como saveSummary, saveResearch, etc., voce DEVE usar este ID (${userId}) no campo 'userId'.
3. Se o usuário fornecer um FATO novo importante (ex: "meu nome é X", "sou especialista em Y"), considere relevante.`
      } catch (e) {
        console.error("Erro ao buscar memórias:", e)
        // Continua sem memoria em caso de erro
      }
    }

    // Converter mensagens usando o helper do AI SDK
    const modelMessages = await convertToModelMessages(messages)

    // Identificar ID da sessão (novo ou existente)
    // Se o cliente nao mandou, vamos criar DEPOIS no onFinish para não criar lixo, 
    // MAS para associar mensagens precisamos dele.
    // Vamos gerar um temporário se não vier.
    const chatId = incomingChatId || crypto.randomUUID()

    // Log
    console.log(`[Chat] Sessão: ${chatId}, Agente: ${selectedAgentId}, User: ${userId}`)

    const result = streamText({
      model,
      system: systemContext,
      messages: modelMessages,
      tools: agentConfig.tools,
      temperature: 0.1,
      maxOutputTokens: 4000,
      stopWhen: stepCountIs(5),

      // Callback executado ao finalizar a stream (Server Side)
      // Nota: Isso roda em background após a resposta começar a ir para o cliente
      onFinish: async ({ response }) => {
        if (!userId) return;

        try {
          // 1. Garantir que a sessão existe no Banco
          let session = await chatService.getSession(chatId)
          if (!session) {
            // Tentar usar o primeiro texto do user como título
            const title = (lastUserMessage as string).slice(0, 50) || "Nova Conversa"

            // Se o ID for novo (gerado aqui), passamos ele?
            // Se o cliente mandou incomingChatId, usamos ele.
            // A sessão NÃO EXISTE, então precisamos criar, com o ID fornecido (ou gerado antes).

            const newSession = await chatService.createSession(userId, selectedAgentId, title, chatId)

            // Se createSession rejeitar o ID, ou se usarmos o ID retornado, precisamos garantir consistencia.
            // Na nossa implementação do createSession, se passamos ID, ele usa.

            // Salvar mensagem do usuário na nova sessão
            await chatService.saveMessage(newSession.id, {
              role: 'user',
              content: lastUserMessage,
              agent_id: 'user'
            })

            const assistantContent = response.messages.find(m => m.role === 'assistant')
            if (assistantContent) {
              let text = ""
              if (typeof assistantContent.content === 'string') text = assistantContent.content
              else if (Array.isArray(assistantContent.content)) {
                text = assistantContent.content
                  .filter(c => c.type === 'text')
                  .map(c => (c as any).text)
                  .join('\n')
              }

              await chatService.saveMessage(newSession.id, {
                role: 'assistant',
                content: text,
                agent_id: selectedAgentId
              })
            }
            return
          }

          // Se sessão já existe (incomingChatId valido)
          await chatService.saveMessage(chatId, {
            role: 'user',
            content: lastUserMessage,
            agent_id: 'user'
          })

          const assistantContent = response.messages.find(m => m.role === 'assistant')
          if (assistantContent) {
            let text = ""
            if (typeof assistantContent.content === 'string') text = assistantContent.content
            else if (Array.isArray(assistantContent.content)) {
              text = assistantContent.content
                .filter(c => c.type === 'text')
                .map(c => (c as any).text)
                .join('\n')
            }

            await chatService.saveMessage(chatId, {
              role: 'assistant',
              content: text,
              agent_id: selectedAgentId
            })
          }

        } catch (err) {
          console.error('[Chat Persistence Error]', err)
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[NewChat API Error]', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
