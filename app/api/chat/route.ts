import { type NextRequest } from "next/server"
import { openai } from "@ai-sdk/openai"
import { streamText, type Message } from "ai"
import { createClient } from "@/lib/supabase/server"
import { DENTAL_SYSTEM_PROMPT, AI_CONFIG, AI_ERROR_MESSAGES } from "@/lib/ai/config"

export const runtime = "edge"
export const maxDuration = 30

type ChatRequestBody = {
  messages?: Message[]
  message?: string // Fallback para compatibilidade
  plan?: string
}

export async function POST(request: NextRequest) {
  try {
    // Autenticação do usuário
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: AI_ERROR_MESSAGES.unauthorized }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Verificar se OPENAI_API_KEY está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error("[chat] OPENAI_API_KEY não configurada")
      return new Response(
        JSON.stringify({ error: AI_ERROR_MESSAGES.invalidKey }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await request.json()) as ChatRequestBody

    // Suporte para dois formatos:
    // 1. { messages: [...] } - formato do useChat do AI SDK
    // 2. { message: "..." } - formato legado
    let messages: Message[]

    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages
    } else if (body.message) {
      // Formato legado - converter para array de mensagens
      messages = [
        {
          id: Date.now().toString(),
          role: "user" as const,
          content: body.message,
        },
      ]
    } else {
      return new Response(
        JSON.stringify({ error: AI_ERROR_MESSAGES.noMessage }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Streaming com OpenAI
    const result = streamText({
      model: openai(AI_CONFIG.model),
      system: DENTAL_SYSTEM_PROMPT,
      messages,
      maxTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      // Metadados para logging
      experimental_telemetry: {
        isEnabled: true,
        functionId: "odonto-gpt-chat",
        metadata: {
          userId: user.id,
          plan: body.plan || "free",
        },
      },
    })

    // Retornar stream response
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[chat] Erro ao processar mensagem:", error)

    // Tratamento específico para rate limiting
    if (error instanceof Error && error.message.includes("rate")) {
      return new Response(
        JSON.stringify({ error: AI_ERROR_MESSAGES.rateLimited }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: AI_ERROR_MESSAGES.apiError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
