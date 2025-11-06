import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message, plan } = body

    // Get N8N webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL not configured")
      return NextResponse.json(
        { error: "Webhook não configurado. Verifique as variáveis de ambiente." },
        { status: 500 }
      )
    }

    // Call N8N webhook with the chat message
    console.log("Calling N8N webhook:", n8nWebhookUrl)

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: userId || "demo-user",
        chatInput: message,
        metadata: {
          plan: plan || "free",
          timestamp: new Date().toISOString(),
        },
      }),
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error("N8N webhook error:", n8nResponse.status, errorText)
      return NextResponse.json(
        { error: `Erro ao processar mensagem: ${n8nResponse.statusText}` },
        { status: n8nResponse.status }
      )
    }

    const n8nData = await n8nResponse.json()
    console.log("N8N response:", n8nData)

    // Extract the AI response from N8N
    // The response structure may vary depending on your N8N workflow
    const reply = n8nData.output || n8nData.reply || n8nData.message || n8nData.response ||
                  "Desculpe, não consegui processar sua mensagem no momento."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagem. Tente novamente." },
      { status: 500 }
    )
  }
}
