import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_N8N_WEBHOOK =
  "https://devthierryc.app.n8n.cloud/webhook/web"

type ChatRequestBody = {
  message?: string
  user?: string
}

type N8nPayload = Record<string, unknown>

const REPLY_KEYS = [
  "reply",
  "output",
  "response",
  "message",
  "text",
] as const

function normalizeN8nPayload(body: unknown): N8nPayload {
  if (Array.isArray(body)) {
    for (const item of body) {
      if (!item || typeof item !== "object") continue

      if ("json" in item && item.json && typeof item.json === "object") {
        return item.json as N8nPayload
      }

      return item as N8nPayload
    }

    return {}
  }

  if (body && typeof body === "object") {
    return body as N8nPayload
  }

  return {}
}

function coerceToString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const text = coerceToString(candidate)
      if (text) {
        return text
      }
    }
    return undefined
  }

  if (value && typeof value === "object") {
    const nestedFields = ["text", "message", "content", "response", "output"]
    for (const field of nestedFields) {
      if (field in value) {
        const text = coerceToString(
          (value as Record<string, unknown>)[field]
        )
        if (text) {
          return text
        }
      }
    }
  }

  return undefined
}

function extractReplyFromPayload(payload: N8nPayload): string | undefined {
  for (const key of REPLY_KEYS) {
    const text = coerceToString(payload[key])
    if (text) {
      return text
    }
  }

  const nestedKeys = ["data", "result", "payload", "outputData"]
  for (const key of nestedKeys) {
    const nested = payload[key]
    if (nested && typeof nested === "object") {
      const reply = extractReplyFromPayload(
        nested as N8nPayload
      )
      if (reply) {
        return reply
      }
    }
  }

  return undefined
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

    const normalizedPayload = normalizeN8nPayload(n8nData)
    const reply =
      extractReplyFromPayload(normalizedPayload) ??
      "O webhook do N8N não retornou uma resposta legível."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Erro interno na rota de chat:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagem. Tente novamente." },
      { status: 500 }
    )
  }
}
