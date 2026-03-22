import { generateText, convertToModelMessages, UIMessage, generateId } from 'ai'
import { openrouter } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { createClient } from '@/lib/supabase/server'
import { createSession, saveMessage, deleteChat, updateChatTitle } from '@/lib/db/simple-queries'

import { isTrialExpired } from '@/lib/trial'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar trial/assinatura
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type, trial_ends_at')
      .eq('id', user.id)
      .single()

    const isPro = profile?.plan_type && profile.plan_type !== 'free'
    const expired = isTrialExpired(profile?.trial_ends_at)

    if (!isPro && expired) {
      return Response.json(
        { error: 'Seu período de teste expirou. Por favor, assine um plano para continuar.' },
        { status: 403 }
      )
    }

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

      // 5. Gerar título (Resumo) se for nova conversa
      if (!sessionId) {
        const rawUserText = (uiMessages[uiMessages.length - 1]?.parts?.[0] as any)?.text || ''
        const userText = rawUserText.substring(0, 1000)

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
