import { streamText, generateText, convertToModelMessages } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { createClient, getUser } from '@/lib/supabase/server'
import { createSession, saveMessage, deleteChat, updateChatTitle } from '@/lib/db/simple-queries'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages: uiMessages, agentId = 'odonto-gpt', sessionId } = await req.json()
    let currentSessionId = sessionId

    // 1. Criar sessão se necessário
    if (!currentSessionId) {
      const lastMsg = uiMessages[uiMessages.length - 1]
      const firstText = lastMsg?.parts?.[0]?.text ?? lastMsg?.content ?? ''
      const title = (typeof firstText === 'string' ? firstText : '').substring(0, 100) || 'Nova Conversa'
      const session = await createSession(user.id, title, agentId)
      if (session) currentSessionId = session.id
    }

    // 2. Salvar mensagem do usuário
    const lastUserMsg = uiMessages[uiMessages.length - 1]
    if (currentSessionId && lastUserMsg?.role === 'user') {
      const text = lastUserMsg?.parts?.[0]?.text ?? lastUserMsg?.content ?? ''
      await saveMessage(currentSessionId, 'user', text)
    }

    // 3. Chamar AI com streaming
    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']
    const modelMessages = await convertToModelMessages(uiMessages)

    const result = streamText({
      model: openrouter(agentConfig.model || 'google/gemini-2.0-flash-001'),
      system: agentConfig.system,
      messages: modelMessages,
      temperature: 0.4,
      async onFinish({ text }) {
        // 4. Salvar resposta do assistente
        if (currentSessionId && text) {
          await saveMessage(currentSessionId, 'assistant', text)

          // 5. Gerar título se for nova conversa
          if (!sessionId) {
            const rawUserText = lastUserMsg?.parts?.[0]?.text ?? lastUserMsg?.content ?? ''
            const userText = (typeof rawUserText === 'string' ? rawUserText : '').substring(0, 1000)

            if (userText) {
              try {
                const { text: title } = await generateText({
                  model: openrouter('google/gemini-2.0-flash-001'),
                  prompt: `Gere um título muito curto (3 a 4 palavras) em português para esta conversa baseada na mensagem: "${userText}". Retorne apenas o título, sem aspas.`,
                })
                if (title) {
                  await updateChatTitle(currentSessionId, title.trim())
                }
              } catch (error) {
                console.error('Error generating title:', error)
              }
            }
          }
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error: any) {
    console.error('[Chat API Error]', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

  const ok = await deleteChat(id, user.id)
  return Response.json({ success: ok })
}
