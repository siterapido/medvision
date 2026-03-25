/**
 * Evolution API Client
 *
 * Integração com Evolution API v2 para envio de mensagens WhatsApp.
 * Documentação: https://doc.evolution-api.com
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[EvolutionAPI] Missing required environment variables: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE')
  }
}

/**
 * Faz uma requisição autenticada para a Evolution API
 */
async function fetchEvolution(path: string, options: RequestInit = {}) {
  const url = `${EVOLUTION_API_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Evolution API error ${response.status}: ${error}`)
  }

  return response.json()
}

/**
 * Envia uma mensagem de texto via Evolution API
 *
 * @param phone - Número de telefone no formato E.164 (ex: 5511999999999)
 * @param text - Texto da mensagem
 * @param instance - Nome da instância (padrão: EVOLUTION_INSTANCE)
 */
export async function sendTextMessage(
  phone: string,
  text: string,
  instance: string = EVOLUTION_INSTANCE
): Promise<void> {
  await fetchEvolution(`/message/sendText/${instance}`, {
    method: 'POST',
    body: JSON.stringify({ number: phone, text }),
  })
}

/**
 * Envia status de "digitando..." para o contato
 *
 * @param phone - Número de telefone
 * @param duration - Duração em milissegundos (padrão: 3000)
 */
export async function sendTyping(
  phone: string,
  duration = 3000,
  instance: string = EVOLUTION_INSTANCE
): Promise<void> {
  try {
    await fetchEvolution(`/chat/sendPresence/${instance}`, {
      method: 'POST',
      body: JSON.stringify({
        number: phone,
        options: { presence: 'composing', delay: duration },
      }),
    })
  } catch {
    // Typing indicators are best-effort, don't fail the message
  }
}

/**
 * Configura o webhook de uma instância
 *
 * @param webhookUrl - URL do webhook
 * @param events - Eventos a serem monitorados
 * @param instance - Nome da instância
 */
export async function configureWebhook(
  webhookUrl: string,
  events: string[] = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
  instance: string = EVOLUTION_INSTANCE
): Promise<void> {
  await fetchEvolution(`/webhook/set/${instance}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      events,
    }),
  })
}

/**
 * Busca informações da instância
 */
export async function getInstanceInfo(instance: string = EVOLUTION_INSTANCE) {
  return fetchEvolution(`/instance/fetchInstances`)
    .then((data: unknown) => {
      const instances = data as Array<{ name: string; connectionStatus: string }>
      return instances.find((i) => i.name === instance) || null
    })
}

// WhatsApp max message length
const MAX_MESSAGE_LENGTH = 4096
const DELAY_BETWEEN_CHUNKS_MS = 1200

function splitMessageIntoChunks(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text]

  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())
  let current = ''

  for (const paragraph of paragraphs) {
    if (current && (current + '\n\n' + paragraph).length > MAX_MESSAGE_LENGTH) {
      chunks.push(current)
      current = paragraph
    } else {
      current += (current ? '\n\n' : '') + paragraph
    }
  }

  if (current) chunks.push(current)

  // Force split if any chunk is still too long
  const result: string[] = []
  for (const chunk of chunks) {
    if (chunk.length > MAX_MESSAGE_LENGTH) {
      for (let i = 0; i < chunk.length; i += MAX_MESSAGE_LENGTH) {
        result.push(chunk.slice(i, i + MAX_MESSAGE_LENGTH))
      }
    } else {
      result.push(chunk)
    }
  }

  return result
}

/**
 * Envia resposta WhatsApp com chunking automático para mensagens longas
 *
 * @param phone - Número de telefone
 * @param text - Texto da mensagem
 * @param instance - Nome da instância
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  instance: string = EVOLUTION_INSTANCE
): Promise<void> {
  const chunks = splitMessageIntoChunks(text)

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i]
    if (chunks.length > 1) {
      chunk = `_(${i + 1}/${chunks.length})_\n\n${chunk}`
    }

    await sendTextMessage(phone, chunk, instance)

    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS))
    }
  }
}
