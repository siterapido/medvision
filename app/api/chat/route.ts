import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_N8N_WEBHOOK =
  "https://devthierryc.app.n8n.cloud/webhook/f9f4b9a0-6775-41f4-bd82-a859d38620d8/chat"

type ChatRequestBody = {
  message?: string
  user?: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, user } = (await request.json()) as ChatRequestBody

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem não informada." },
        { status: 400 }
      )
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL ?? DEFAULT_N8N_WEBHOOK
    console.log("Enviando mensagem para o webhook N8N:", n8nWebhookUrl)

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: user || "demo-user",
        text: {
          message,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na chamada ao webhook N8N:", response.status, errorText)
      return NextResponse.json(
        { error: `Falha ao enviar mensagem: ${response.statusText}` },
        { status: response.status }
      )
    }

    const n8nData = await response.json()
    console.log("Resposta do N8N:", n8nData)
    return NextResponse.json(n8nData)
  } catch (error) {
    console.error("Erro interno na rota de chat:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagem. Tente novamente." },
      { status: 500 }
    )
  }
}
