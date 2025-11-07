import crypto from "node:crypto"

import { z } from "zod"

const DEFAULT_ALLOWED_STATUSES = ["paid", "approved", "active"]
const DEFAULT_WHATSAPP_COUNTRY = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "55").replace(/\D/g, "") || "55"
const SIGNATURE_HEADER = process.env.KIWFY_SIGNATURE_HEADER ?? "x-kiwfy-signature"

export const KiwfyPlanSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((value) => value?.toString()).optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
  })
  .optional()

export const KiwfyCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsapp_opt_in: z.boolean().optional(),
})

export const KiwfyWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.union([z.string(), z.number()]).transform((value) => value?.toString()).optional(),
    purchase_id: z.union([z.string(), z.number()]).transform((value) => value?.toString()).optional(),
    status: z.string().min(1),
    plan_slug: z.string().optional(),
    plan_name: z.string().optional(),
    plan: KiwfyPlanSchema,
    customer: KiwfyCustomerSchema,
    metadata: z.record(z.any()).optional(),
    whatsapp_opt_in: z.boolean().optional(),
    redirect_url: z.string().url().optional(),
  }),
})

export type KiwfyWebhookPayload = z.infer<typeof KiwfyWebhookSchema>

const allowedStatuses = (process.env.KIWFY_PROVISION_STATUSES ?? DEFAULT_ALLOWED_STATUSES.join(","))
  .split(",")
  .map((status) => status.trim().toLowerCase())
  .filter(Boolean)

export function normalizeStatus(status: string | undefined | null) {
  return status?.toLowerCase().trim() ?? ""
}

export function shouldProvision(status: string | undefined | null) {
  const normalized = normalizeStatus(status)
  if (!normalized) return false
  return allowedStatuses.includes(normalized)
}

export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null

  let normalized = digits.replace(/^0+/, "")
  if (!normalized.startsWith(DEFAULT_WHATSAPP_COUNTRY)) {
    const shouldPrependCountry = normalized.length <= 11
    normalized = shouldPrependCountry ? `${DEFAULT_WHATSAPP_COUNTRY}${normalized}` : normalized
  }

  return `+${normalized}`
}

export function sanitizePhoneForZApi(phone: string) {
  return phone.replace(/\D/g, "")
}

export function resolvePurchaseId(data: KiwfyWebhookPayload["data"]) {
  return data.purchase_id ?? data.id ?? null
}

export function resolvePlanSlug(data: KiwfyWebhookPayload["data"]) {
  return data.plan_slug ?? data.plan?.slug ?? data.plan?.name ?? data.plan_name ?? null
}

export function resolveWhatsappOptIn(data: KiwfyWebhookPayload["data"]) {
  const customerOptIn = data.customer.whatsapp_opt_in
  return data.whatsapp_opt_in ?? customerOptIn ?? true
}

export function verifyKiwfySignature(rawBody: string, providedSignature: string | null) {
  const secret = process.env.KIWFY_WEBHOOK_SECRET

  if (!secret) {
    throw new Error("KIWFY_WEBHOOK_SECRET não configurado.")
  }

  if (!providedSignature) {
    return false
  }

  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

  if (providedSignature.length !== computed.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(providedSignature))
}

export function extractSignature(request: Request) {
  return request.headers.get(SIGNATURE_HEADER)
}
