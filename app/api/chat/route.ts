import { generateText, convertToModelMessages, UIMessage, generateId } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { createClient } from '@/lib/supabase/server'
import { createSession, saveMessage, deleteChat } from '@/lib/db/simple-queries'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages: uiMessages, agentId = 'odonto-gpt', sessionId } = await req.json()
    let currentSessionId = sessionId

    // 1. Criar sessão se necessário
    if (!currentSessionId) {
      const firstMsg = uiMessages[uiMessages.length - 1]?.parts?.[0] as any
      const title = firstMsg?.text?.substring(0, 100) || 'Nova Conversa'
      const session = await createSession(user.id, title, agentId)
      if (session) currentSessionId = session.id
    }

    // 2. Salvar mensagem do usuário
    const lastUserMsg = uiMessages[uiMessages.length - 1]
    if (currentSessionId && lastUserMsg?.role === 'user') {
      const text = (lastUserMsg.parts?.[0] as any)?.text || ''
      await saveMessage(currentSessionId, 'user', text)
    }

    // 3. Chamar AI
    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']
    const modelMessages = await convertToModelMessages(uiMessages)

    const result = await generateText({
      model: openrouter(agentConfig.model || 'google/gemini-2.0-flash-001'),
      system: agentConfig.system,
      messages: modelMessages,
      temperature: 0.4,
    })

    // 4. Salvar resposta do assistente
    if (currentSessionId && result.text) {
      await saveMessage(currentSessionId, 'assistant', result.text)
    }

    return Response.json({
      message: { id: generateId(), role: 'assistant', parts: [{ type: 'text', text: result.text }] },
      sessionId: currentSessionId,
    })
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
