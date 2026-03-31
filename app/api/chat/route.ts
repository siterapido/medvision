import { streamText, generateText, convertToModelMessages, stepCountIs } from 'ai'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'
import { createClient, getUser } from '@/lib/supabase/server'
import { createSession, saveMessage, deleteChat, updateChatTitle } from '@/lib/db/simple-queries'
import { initializeContext } from '@/lib/ai/artifacts/context.server'
import { hasEnoughCredits, deductCredits } from '@/lib/credits/service'

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages: uiMessages, agentId = 'odonto-gpt', sessionId } = await req.json()
    let currentSessionId = sessionId

    // Verificar créditos antes de processar
    const agentConfigCheck = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']
    const modelToUse = agentConfigCheck.model || MODELS.chat
    const creditCheck = await hasEnoughCredits(user.id, modelToUse)
    if (!creditCheck.ok) {
      return Response.json(
        {
          error: 'credits_exhausted',
          message: `Créditos insuficientes. Saldo: ${creditCheck.balance}, necessário: ${creditCheck.cost}. Seu limite mensal é de ${creditCheck.monthly_limit} créditos.`,
          balance: creditCheck.balance,
          cost: creditCheck.cost,
          monthly_limit: creditCheck.monthly_limit,
        },
        { status: 402 }
      )
    }

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

    // 3. Inicializar contexto e injetar perfil do aluno no system prompt
    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt']

    const odontoCtx = await initializeContext(user.id, currentSessionId || '', agentId)
    const profile = odontoCtx.userProfile

    const profileLines: string[] = []
    if (profile.name) profileLines.push(`- Nome: ${profile.name}`)
    if (profile.university) profileLines.push(`- Universidade: ${profile.university}`)
    if (profile.semester) profileLines.push(`- Semestre: ${profile.semester}`)
    if (profile.specialty) profileLines.push(`- Área de interesse: ${profile.specialty}`)
    if (profile.level) profileLines.push(`- Nível acadêmico: ${profile.level}`)

    const profileSection = profileLines.length > 0
      ? `\n\n---\n## Contexto do Aluno (use para personalizar respostas)\n${profileLines.join('\n')}\n---`
      : ''

    const systemWithProfile = agentConfig.system + profileSection

    // 4. Chamar AI com streaming, ferramentas e perfil injetado
    const modelMessages = await convertToModelMessages(uiMessages)

    const result = streamText({
      model: openrouter(agentConfig.model || MODELS.chat),
      system: systemWithProfile,
      messages: modelMessages,
      tools: agentConfig.tools,
      stopWhen: stepCountIs(5),
      temperature: 0.65,
      maxOutputTokens: 8000,
      timeout: 120000,
      async onFinish({ text }) {
        // 5. Debitar créditos pelo uso do modelo
        await deductCredits(user.id, agentConfig.model || MODELS.chat, 'chat')

        // 6. Salvar resposta do assistente
        if (currentSessionId && text) {
          await saveMessage(currentSessionId, 'assistant', text)

          // 7. Gerar título se for nova conversa (usa modelo barato)
          if (!sessionId) {
            const rawUserText = lastUserMsg?.parts?.[0]?.text ?? lastUserMsg?.content ?? ''
            const userText = (typeof rawUserText === 'string' ? rawUserText : '').substring(0, 1000)

            if (userText) {
              try {
                const { text: title } = await generateText({
                  model: openrouter(MODELS.titler),
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
