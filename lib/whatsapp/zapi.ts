import { sanitizePhoneForZApi } from "@/lib/kiwfy/webhook"

type ZApiConfig = {
  baseUrl: string
  instanceId: string
  token: string
  senderName?: string
}

type MagicLinkPayload = {
  phone: string
  magicLink: string
  name?: string | null
  plan?: string | null
}

export type ZApiDeliveryResult =
  | { status: "sent"; response: unknown }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string; response?: unknown }

let cachedConfig: ZApiConfig | null = null

function loadConfig(): ZApiConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const baseUrl = process.env.ZAPI_BASE_URL ?? "https://api.z-api.io"
  const senderName = process.env.ZAPI_SENDER_NAME

  if (!instanceId || !token) {
    throw new Error("Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN para enviar mensagens pelo WhatsApp.")
  }

  cachedConfig = {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    instanceId,
    token,
    senderName: senderName?.trim() || undefined,
  }

  return cachedConfig
}

function buildWhatsAppMessage(payload: MagicLinkPayload, senderName?: string) {
  const greetingName = payload.name?.trim() || "Dr(a)."
  const planSuffix = payload.plan ? ` do plano ${payload.plan}` : ""
  const signature = senderName ? `\n\n— ${senderName}` : "\n\nEquipe Odonto GPT"

  return [
    `Olá ${greetingName}!`,
    `Confirmamos o pagamento${planSuffix} e seu acesso ao Odonto GPT já está liberado.`,
    `Use este link seguro para entrar imediatamente: ${payload.magicLink}`,
    "Se o link expirar, basta solicitar um novo acesso diretamente no app.",
    signature,
  ].join("\n")
}

export async function sendMagicLinkViaWhatsApp(payload: MagicLinkPayload): Promise<ZApiDeliveryResult> {
  const config = loadConfig()
  const digits = sanitizePhoneForZApi(payload.phone)

  if (!digits) {
    return { status: "skipped", reason: "Telefone vazio ou inválido para WhatsApp." }
  }

  const endpoint = `${config.baseUrl}/instances/${config.instanceId}/token/${config.token}/send-messages`
  const body = {
    phone: digits,
    message: buildWhatsAppMessage(payload, config.senderName),
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text()
    let parsed: unknown = null
    if (rawText) {
      try {
        parsed = JSON.parse(rawText)
      } catch {
        parsed = rawText
      }
    }

    if (!response.ok) {
      return {
        status: "failed",
        error: `Z-API retornou ${response.status}`,
        response: parsed,
      }
    }

    return {
      status: "sent",
      response: parsed,
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Falha desconhecida ao chamar a Z-API",
    }
  }
}
