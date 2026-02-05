/**
 * Z-API WhatsApp Integration Client
 *
 * Full client for the Z-API REST API with support for:
 * - Sending text, images, documents, and links
 * - Instance status checking
 * - Retry logic with exponential backoff
 * - Proper error handling
 *
 * @see https://developer.z-api.io/en/
 */

const Z_API_BASE_URL = "https://api.z-api.io/instances"

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

interface ZApiConfig {
  instanceId: string
  token: string
  clientToken: string
}

export interface ZApiResponse {
  zaapId: string
  messageId: string
}

export interface ZApiInstanceStatus {
  connected: boolean
  smartphoneConnected?: boolean
  session?: string
  error?: string
}

export class ZApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string
  ) {
    super(message)
    this.name = "ZApiError"
  }
}

function getConfig(): ZApiConfig {
  const instanceId = process.env.Z_API_INSTANCE_ID?.replace(/"/g, "").trim()
  const token = process.env.Z_API_TOKEN?.replace(/"/g, "").trim()
  const clientToken = process.env.Z_API_CLIENT_TOKEN?.replace(/"/g, "").trim()

  if (!instanceId || !token) {
    throw new ZApiError(
      "Z_API credentials not configured. Set Z_API_INSTANCE_ID and Z_API_TOKEN environment variables.",
      0,
      ""
    )
  }

  if (!clientToken) {
    throw new ZApiError(
      "Z_API_CLIENT_TOKEN not configured. Set the Z_API_CLIENT_TOKEN environment variable.",
      0,
      ""
    )
  }

  return { instanceId, token, clientToken }
}

/**
 * Check if Z-API is configured (env vars present)
 */
export function isZApiConfigured(): boolean {
  const instanceId = process.env.Z_API_INSTANCE_ID?.replace(/"/g, "").trim()
  const token = process.env.Z_API_TOKEN?.replace(/"/g, "").trim()
  const clientToken = process.env.Z_API_CLIENT_TOKEN?.replace(/"/g, "").trim()
  return !!(instanceId && token && clientToken)
}

/**
 * Normalize a Brazilian phone number to E.164 format
 * Removes non-digit chars and prepends country code 55 if missing
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return `55${cleaned}`
  }
  return cleaned
}

/**
 * Build the base URL for a Z-API endpoint
 */
function buildUrl(action: string): string {
  const { instanceId, token } = getConfig()
  return `${Z_API_BASE_URL}/${instanceId}/token/${token}/${action}`
}

/**
 * Get default headers for Z-API requests
 */
function getHeaders(): HeadersInit {
  const { clientToken } = getConfig()
  return {
    "Content-Type": "application/json",
    "Client-Token": clientToken,
  }
}

/**
 * Execute a Z-API request with retry logic
 */
async function zapiRequest<T = ZApiResponse>(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorText = await response.text()
        const error = new ZApiError(
          `Z-API Error ${response.status}: ${response.statusText}`,
          response.status,
          errorText
        )

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error
        }

        lastError = error
        if (attempt < retries) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
          console.warn(
            `[Z-API] Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`,
            error.message
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        throw error
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof ZApiError) {
        throw error
      }

      lastError = error as Error
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
        console.warn(
          `[Z-API] Network error (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`,
          (error as Error).message
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error("Z-API request failed after retries")
}

// ─── Sending Methods ─────────────────────────────────────────────────────

/**
 * Send a text message via Z-API
 *
 * @param phone - Recipient phone number (will be normalized)
 * @param message - Text message content (supports WhatsApp formatting)
 * @param options - Optional delay settings
 */
export async function sendZApiText(
  phone: string,
  message: string,
  options?: { delayMessage?: number; delayTyping?: number }
): Promise<ZApiResponse> {
  const url = buildUrl("send-text")
  const finalPhone = normalizePhone(phone)

  console.log(`[Z-API] Sending text to ${finalPhone}, length: ${message.length}`)

  const body: Record<string, unknown> = {
    phone: finalPhone,
    message,
  }

  if (options?.delayMessage) body.delayMessage = options.delayMessage
  if (options?.delayTyping) body.delayTyping = options.delayTyping

  return zapiRequest<ZApiResponse>(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
}

/**
 * Send an image via Z-API
 *
 * @param phone - Recipient phone number
 * @param image - Image URL or Base64-encoded data
 * @param caption - Optional image caption
 */
export async function sendZApiImage(
  phone: string,
  image: string,
  caption?: string
): Promise<ZApiResponse> {
  const url = buildUrl("send-image")
  const finalPhone = normalizePhone(phone)

  console.log(`[Z-API] Sending image to ${finalPhone}`)

  const body: Record<string, unknown> = {
    phone: finalPhone,
    image,
  }

  if (caption) body.caption = caption

  return zapiRequest<ZApiResponse>(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
}

/**
 * Send a document via Z-API
 *
 * @param phone - Recipient phone number
 * @param documentUrl - URL of the document
 * @param extension - File extension (e.g., "pdf", "docx")
 * @param fileName - Display name for the document
 */
export async function sendZApiDocument(
  phone: string,
  documentUrl: string,
  extension: string,
  fileName?: string
): Promise<ZApiResponse> {
  const url = buildUrl(`send-document/${extension}`)
  const finalPhone = normalizePhone(phone)

  console.log(`[Z-API] Sending document (${extension}) to ${finalPhone}`)

  const body: Record<string, unknown> = {
    phone: finalPhone,
    document: documentUrl,
  }

  if (fileName) body.fileName = fileName

  return zapiRequest<ZApiResponse>(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
}

/**
 * Send a link with preview via Z-API
 *
 * @param phone - Recipient phone number
 * @param message - Accompanying text message
 * @param linkUrl - URL to send
 * @param title - Link preview title
 * @param description - Link preview description
 * @param image - Link preview image URL
 */
export async function sendZApiLink(
  phone: string,
  message: string,
  linkUrl: string,
  title?: string,
  description?: string,
  image?: string
): Promise<ZApiResponse> {
  const url = buildUrl("send-link")
  const finalPhone = normalizePhone(phone)

  console.log(`[Z-API] Sending link to ${finalPhone}: ${linkUrl}`)

  const body: Record<string, unknown> = {
    phone: finalPhone,
    message,
    linkUrl,
  }

  if (title) body.title = title
  if (description) body.description = description
  if (image) body.image = image

  return zapiRequest<ZApiResponse>(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
}

// ─── Instance Management ─────────────────────────────────────────────────

/**
 * Check the instance connection status
 *
 * @returns Instance status with connection info
 */
export async function getInstanceStatus(): Promise<ZApiInstanceStatus> {
  const url = buildUrl("status")

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Z-API] Status check failed:", errorText)
      return { connected: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return {
      connected: data.connected === true,
      smartphoneConnected: data.smartphoneConnected,
      session: data.session,
    }
  } catch (error) {
    console.error("[Z-API] Status check error:", error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ─── Webhook Security ────────────────────────────────────────────────────

/**
 * Validate the client-token header from incoming Z-API webhooks
 *
 * Z-API sends the Client-Token header with each webhook request.
 * This function validates it against the configured token.
 *
 * @param headerValue - The Client-Token header value from the request
 * @returns true if the token matches or validation is disabled (no client token configured)
 */
export function validateWebhookToken(headerValue: string | null): boolean {
  const clientToken = process.env.Z_API_CLIENT_TOKEN?.replace(/"/g, "").trim()

  // If no client token is configured, skip validation
  if (!clientToken) {
    console.warn("[Z-API] No CLIENT_TOKEN configured - webhook token validation skipped")
    return true
  }

  if (!headerValue) {
    console.warn("[Z-API] Webhook request missing Client-Token header")
    return false
  }

  return headerValue === clientToken
}
