// Constantes e helpers usáveis no cliente (sem DB). Funções que acessam o banco: `@/lib/cakto-server`.

// Planos de assinatura anual
export const CAKTO_BASIC_ANNUAL_PLAN_ID = "pdjvzs7_751299"
export const CAKTO_PRO_ANNUAL_PLAN_ID = "76x6iou_751311"

// Planos de assinatura mensal
export const CAKTO_BASIC_MONTHLY_PLAN_ID = "pdjvzs7_751299" // TODO: substituir pelo ID do plano mensal no Cakto
export const CAKTO_PRO_MONTHLY_PLAN_ID = "76x6iou_751311" // TODO: substituir pelo ID do plano mensal no Cakto

// Produto vitalício (one-time)
export const CAKTO_CERTIFICATE_ID = "pi6xasc_754503"

// Curso Consultório do Futuro (20h) com certificado
export const CAKTO_CONSULTORIO_FUTURO_ID = "pi6xasc_754503"
export const CONSULTORIO_FUTURO_COURSE = {
  id: "consultorio-do-futuro",
  name: "Consultório do Futuro",
  hours: 20,
  caktoProductId: CAKTO_CONSULTORIO_FUTURO_ID,
  checkoutUrl: `https://pay.cakto.com.br/${CAKTO_CONSULTORIO_FUTURO_ID}`,
}

// Evento: Palestra Online – Consultório do Futuro na Odontologia (IA)
export const PALESTRA_IA_EVENT = {
  id: "palestra-consultorio-futuro-ia",
  name: "Palestra Online – Consultório do Futuro na Odontologia (IA)",
  hours: 20,
  date: "2026-02-05T23:00:00Z", // 20:00 BRT
  caktoProductId: CAKTO_CERTIFICATE_ID,
  checkoutUrl: `https://pay.cakto.com.br/${CAKTO_CERTIFICATE_ID}`,
}

// Aliases para compatibilidade (deprecated)
export const CAKTO_ANNUAL_PLAN_ID = CAKTO_BASIC_ANNUAL_PLAN_ID
export const CAKTO_MONTHLY_PLAN_ID = CAKTO_BASIC_ANNUAL_PLAN_ID // deprecated - sem plano mensal

const DEFAULT_CAKTO_PRODUCT_ID = CAKTO_PRO_ANNUAL_PLAN_ID
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]+$/

function extractProductId(input?: string) {
  const value = (input ?? "").trim()
  if (!value) return DEFAULT_CAKTO_PRODUCT_ID
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value)
      const parts = url.pathname.split("/").filter(Boolean)
      const last = parts[parts.length - 1] ?? ""
      return PRODUCT_ID_PATTERN.test(last) ? last : DEFAULT_CAKTO_PRODUCT_ID
    } catch {
      return DEFAULT_CAKTO_PRODUCT_ID
    }
  }
  return PRODUCT_ID_PATTERN.test(value) ? value : DEFAULT_CAKTO_PRODUCT_ID
}

function resolveProductId() {
  return extractProductId(
    process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID ??
      process.env.CAKTO_PRODUCT_ID ??
      DEFAULT_CAKTO_PRODUCT_ID,
  )
}

type SuccessResponse<T> = { success: true } & T
type FailureResponse = { success: false; message: string }

export type SubscriptionStatusResponse =
  | SuccessResponse<{
      user: {
        email: string
        plan: string
        subscription_status: string
        expires_at?: string | null
        isPremium: boolean
      }
    }>
  | FailureResponse

export type PaymentHistoryResponse =
  | SuccessResponse<{ payments: PaymentHistoryEntry[] }>
  | FailureResponse

export type PaymentHistoryEntry = {
  transaction_id: string
  amount: number
  currency: string
  status: string
  payment_method?: string | null
  webhook_data?: unknown
  created_at: string
}

function normalizeEmail(email?: string) {
  if (!email) {
    return null
  }

  const trimmed = email.trim().toLowerCase()
  return trimmed === "" ? null : trimmed
}

export function generateCheckoutUrl(
  userEmail: string,
  customData: Record<string, string> = {},
  productId?: string,
) {
  const normalizedEmail = normalizeEmail(userEmail)
  if (!normalizedEmail) {
    throw new Error("E-mail inválido para gerar checkout")
  }

  const resolvedProductId = productId || resolveProductId()
  if (!PRODUCT_ID_PATTERN.test(resolvedProductId)) {
    throw new Error("ID de produto Cakto inválido")
  }

  const params = new URLSearchParams({
    email: normalizedEmail,
    ...customData,
  })

  const baseUrl = `https://pay.cakto.com.br/${resolvedProductId}`
  return `${baseUrl}?${params.toString()}`
}
