/**
 * Webhook para receber mensagens do WhatsApp via Z-API
 *
 * Este endpoint:
 * 1. Recebe callbacks do Z-API quando mensagens são recebidas
 * 2. Identifica ou cria usuário por telefone
 * 3. Cria ou recupera thread de conversa
 * 4. Salva mensagem do usuário no banco
 * 5. Gera resposta com AI agent (usando histórico completo)
 * 6. Salva resposta no banco
 * 7. Envia resposta dividida em chunks se necessário
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processConversationSync } from "@/lib/ai/agent"
import { sendWhatsAppResponse } from "@/lib/whatsapp/send-response"
import { normalizePhone, isValidWhatsAppNumber } from "@/lib/utils/phone"
import type { ZApiWebhookPayload, ZApiWebhookMessage } from "@/lib/ai/types"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Extrai informações relevantes da mensagem Z-API
 */
function parseZApiMessage(body: ZApiWebhookMessage) {
  return {
    phone: body.phone,
    messageId: body.messageId,
    isGroup: body.isGroup,
    fromMe: body.fromMe,
    text: body.text?.message || "",
    hasImage: !!body.image,
    hasAudio: !!body.audio,
    hasDocument: !!body.document,
    senderName: body.senderName || body.chatName,
  }
}

/**
 * Valida o webhook secret (opcional, mas recomendado)
 */
function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.Z_API_WEBHOOK_SECRET
  if (!secret) {
    return true
  }

  const headerSecret = request.headers.get("x-webhook-secret")
  return headerSecret === secret
}

/**
 * Identifica ou cria usuário por telefone
 */
async function identifyOrCreateUser(supabase: Awaited<ReturnType<typeof createClient>>, phone: string, senderName: string) {
  const normalizedPhone = normalizePhone(phone)

  // Buscar usuário existente
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp", normalizedPhone)
    .maybeSingle()

  if (existingProfile) {
    console.log(`[WhatsApp] Usuário existente encontrado: ${existingProfile.id}`)
    return existingProfile
  }

  // Criar novo usuário
  console.log(`[WhatsApp] Criando novo usuário para ${normalizedPhone}`)

  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      whatsapp: normalizedPhone,
      whatsapp_optin: true, // Opt-in implícito
      whatsapp_optin_at: new Date().toISOString(),
      name: senderName || "Usuário WhatsApp",
      email: null,
      avatar_url: null,
      role: "user",
    })
    .select()
    .single()

  if (error) {
    console.error(`[WhatsApp] Erro ao criar perfil:`, error)
    throw error
  }

  return newProfile
}

/**
 * Cria ou recupera thread de conversa
 */
async function getOrCreateThread(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, userName: string) {
  // Buscar thread existente do WhatsApp
  const { data: existingThread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("user_id", userId)
    .eq("channel", "whatsapp")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingThread) {
    console.log(`[WhatsApp] Thread existente: ${existingThread.id}`)
    return existingThread
  }

  // Criar nova thread
  const { data: newThread, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: userId,
      channel: "whatsapp",
      title: `WhatsApp - ${userName}`,
    })
    .select("id")
    .single()

  if (error) {
    console.error(`[WhatsApp] Erro ao criar thread:`, error)
    throw error
  }

  console.log(`[WhatsApp] Nova thread criada: ${newThread.id}`)
  return newThread
}

/**
 * Busca histórico de conversa para contexto
 */
async function getConversationHistory(supabase: Awaited<ReturnType<typeof createClient>>, threadId: string, limit: number = 20) {
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit)

  return messages || []
}

/**
 * Salva mensagem no banco
 */
async function saveMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  threadId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    user_id: userId,
    role,
    content,
    metadata: metadata || {},
  })

  if (error) {
    console.error(`[WhatsApp] Erro ao salvar mensagem:`, error)
    throw error
  }
}

/**
 * Process special commands in agent response
 */
async function processSpecialCommands(
  response: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string | null
): Promise<string> {
  let processedResponse = response

  // Handle SEND_PAYMENT_LINK command
  if (processedResponse.includes('[SEND_PAYMENT_LINK]')) {
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://odontogpt.com.br'}/checkout?ref=${userId}`
    processedResponse = processedResponse.replace('[SEND_PAYMENT_LINK]', `\n\n👉 Link de pagamento: ${paymentLink}`)
  }

  // Handle SEND_PASSWORD_RESET command
  if (processedResponse.includes('[SEND_PASSWORD_RESET]')) {
    if (userEmail) {
      try {
        // Request password reset from Supabase auth
        await supabase.auth.resetPasswordForEmail(userEmail)
        processedResponse = processedResponse.replace(
          '[SEND_PASSWORD_RESET]',
          '\n\n✅ Enviamos um link de recuperação para seu email!'
        )
      } catch (error) {
        console.error('[Webhook] Error sending password reset:', error)
        processedResponse = processedResponse.replace(
          '[SEND_PASSWORD_RESET]',
          '\n\n📧 Verifique seu email para recuperar sua senha.'
        )
      }
    } else {
      processedResponse = processedResponse.replace(
        '[SEND_PASSWORD_RESET]',
        '\n\n📧 Configure seu email na sua conta para usar esta funcionalidade.'
      )
    }
  }

  // Handle SEND_DASHBOARD_LINK command
  if (processedResponse.includes('[SEND_DASHBOARD_LINK]')) {
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://odontogpt.com.br'}/dashboard`
    processedResponse = processedResponse.replace('[SEND_DASHBOARD_LINK]', `\n\n👉 Acesse: ${dashboardLink}`)
  }

  return processedResponse
}

/**
 * Envia mensagem de boas-vindas
 */
async function sendWelcomeMessage(phone: string, userName: string) {
  const welcomeMessage = `🦷 Olá ${userName}, bem-vindo ao *Odonto GPT*!

Sou sua assistente de IA especializada em Odontologia. Posso ajudar com:

✅ Diagnósticos e casos clínicos
✅ Protocolos de tratamento
✅ Dúvidas sobre procedimentos
✅ Pesquisas científicas atualizadas

Como posso ajudar hoje?

_Para acessar todas as funcionalidades, visite: https://odontogpt.com.br_`

  await sendWhatsAppResponse(phone, welcomeMessage)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Validar secret
    if (!validateWebhookSecret(request)) {
      console.warn("[Z-API Webhook] Secret inválido")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as ZApiWebhookPayload

    console.log("[Z-API Webhook] Recebido:", {
      type: payload.type,
      phone: payload.phone,
    })

    // Apenas processar mensagens recebidas
    if (payload.type !== "ReceivedCallback") {
      return NextResponse.json({ ok: true })
    }

    const message = parseZApiMessage(payload.body)

    // Ignorar mensagens próprias, de grupo ou vazias
    if (message.fromMe) {
      console.log("[Z-API Webhook] Ignorando mensagem própria")
      return NextResponse.json({ ok: true })
    }

    if (message.isGroup) {
      console.log("[Z-API Webhook] Ignorando mensagem de grupo")
      return NextResponse.json({ ok: true })
    }

    if (!message.text) {
      if (message.hasAudio || message.hasImage || message.hasDocument) {
        await sendWhatsAppResponse(
          message.phone,
          "Desculpe, no momento só consigo processar mensagens de texto. Por favor, digite sua dúvida. 📝"
        )
      }
      return NextResponse.json({ ok: true })
    }

    // Validar telefone
    if (!isValidWhatsAppNumber(message.phone)) {
      console.error(`[WhatsApp] Telefone inválido: ${message.phone}`)
      return NextResponse.json({ ok: true })
    }

    const normalizedPhone = normalizePhone(message.phone)
    console.log(`[WhatsApp] Processando mensagem de ${normalizedPhone}`)

    // 1. Identificar ou criar usuário
    const user = await identifyOrCreateUser(supabase, message.phone, message.senderName)

    // 2. Criar ou recuperar thread
    const thread = await getOrCreateThread(supabase, user.id, user.name || message.senderName)

    // 3. Salvar mensagem do usuário
    await saveMessage(supabase, thread.id, user.id, "user", message.text, {
      source: "whatsapp",
      wa_message_id: message.messageId,
      phone: normalizedPhone,
    })

    // 4. Se for novo usuário, enviar boas-vindas
    const isNewUser = !user.updated_at || new Date(user.updated_at).getTime() < Date.now() - 60000 // Menos de 1 minuto
    if (isNewUser && user.created_at && new Date(user.created_at).getTime() > Date.now() - 60000) {
      await sendWelcomeMessage(normalizedPhone, user.name || message.senderName)
    }

    // 5. Buscar histórico para contexto
    const history = await getConversationHistory(supabase, thread.id, 20)

    // 6. Gerar resposta com IA
    const agentMessages = history.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))
    // Adicionar mensagem atual
    agentMessages.push({ role: "user" as const, content: message.text })

    let response = await processConversationSync(agentMessages, normalizedPhone)

    console.log(`[WhatsApp] Resposta gerada (${response.length} chars)`)

    // 6.5 Process special commands
    response = await processSpecialCommands(response, supabase, user.id, user.email || null)

    console.log(`[WhatsApp] Resposta processada (${response.length} chars)`)

    // 7. Salvar resposta no banco
    await saveMessage(supabase, thread.id, user.id, "assistant", response, {
      source: "whatsapp",
      phone: normalizedPhone,
    })

    // 8. Enviar resposta (com splitting se necessário)
    await sendWhatsAppResponse(normalizedPhone, response)

    console.log(`[WhatsApp] Resposta enviada para ${normalizedPhone}`)

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      userId: user.id,
      threadId: thread.id,
    })
  } catch (error) {
    console.error("[Z-API Webhook] Erro:", error)

    // Não retornar erro para Z-API (para evitar retries)
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : "Erro interno",
    })
  }
}

/**
 * GET para verificar se o webhook está ativo
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Odonto GPT WhatsApp Webhook",
    timestamp: new Date().toISOString(),
  })
}
