
import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { streamAgnoChat } from "@/lib/ai/agno-service"
import { AI_ERROR_MESSAGES } from "@/lib/ai/config"
import { LangChainAdapter } from "ai"

export const runtime = "edge"
export const maxDuration = 60 // Extended duration for agent processing

type ChatRequestBody = {
  messages?: any[]
  message?: string
  plan?: string
  sessionId?: string
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

    const body = (await request.json()) as ChatRequestBody

    let lastMessageContent = ""
    let images: string[] = []

    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1]
      lastMessageContent = lastMsg.content
      // Check for images in experimental_attachments or typical content structure
      // For now, assuming text content
    } else if (body.message) {
      lastMessageContent = body.message
    } else {
      return new Response(
        JSON.stringify({ error: AI_ERROR_MESSAGES.noMessage }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Call AGNO Service
    const stream = await streamAgnoChat(
      lastMessageContent,
      user.id,
      body.sessionId, // User provided or component generated session ID
      "auto"
    )

    // Convert the raw text stream (Uint8Array) to Agno stream compatible with AI SDK
    // LangChainAdapter.toDataStreamResponse handles a stream of strings
    // We need to decode the byte stream to strings
    const decoder = new TextDecoder()
    const textStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(decoder.decode(value, { stream: true }))
          }
        } finally {
          reader.releaseLock()
        }
      }
    })

    return LangChainAdapter.toDataStreamResponse(textStream)

  } catch (error) {
    console.error("[chat] Erro ao processar mensagem via AGNO:", error)
    return new Response(
      JSON.stringify({ error: AI_ERROR_MESSAGES.apiError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
