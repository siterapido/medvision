
import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { streamAgnoChat } from "@/lib/ai/agno-service"
import { AI_ERROR_MESSAGES } from "@/lib/ai/config"

export const runtime = "edge"
export const maxDuration = 60 // Extended duration for agent processing

type ChatRequestBody = {
  messages?: any[]
  message?: string
  plan?: string
  sessionId?: string
  imageUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    // Autenticação do usuário
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[chat] Usuário não autenticado")
      return new Response("Unauthorized", { status: 401 })
    }

    const body = (await request.json()) as ChatRequestBody

    console.log("[chat] Recebida requisição:", {
      hasMessages: !!body.messages,
      messagesCount: body.messages?.length,
      hasMessage: !!body.message,
      hasImageUrl: !!body.imageUrl,
      sessionId: body.sessionId
    })

    let lastMessageContent = ""
    let images: string[] = []

    // Extract message content from the request
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      // useChat SDK sends messages array
      const lastMsg = body.messages[body.messages.length - 1]
      lastMessageContent = lastMsg.content || ""
      console.log("[chat] Mensagem extraída do array messages:", lastMessageContent)
    } else if (body.message) {
      // Fallback for direct message
      lastMessageContent = body.message
      console.log("[chat] Mensagem extraída de body.message:", lastMessageContent)
    } else {
      console.error("[chat] Nenhuma mensagem encontrada na requisição")
      return new Response("No message provided", { status: 400 })
    }

    // Add imageUrl to images array if provided
    if (body.imageUrl) {
      images = [body.imageUrl]
      console.log("[chat] Imagem incluída:", body.imageUrl)
    }

    // Determine agent type based on presence of images
    const agentType = images.length > 0 ? "image-analysis" : "auto"
    console.log("[chat] Tipo de agente:", agentType)

    // Call AGNO Service
    console.log("[chat] Chamando Agno service...")
    const stream = await streamAgnoChat(
      lastMessageContent,
      user.id,
      body.sessionId,
      agentType,
      images
    )

    // Return stream directly with proper headers for useChat
    console.log("[chat] Retornando stream")
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-vercel-ai-message-stream": "v1"
      }
    })

  } catch (error) {
    console.error("[chat] Erro ao processar mensagem via AGNO:", error)
    return new Response(
      JSON.stringify({ error: AI_ERROR_MESSAGES.apiError }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
