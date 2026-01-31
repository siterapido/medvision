import { createAdminClient } from "@/lib/supabase/admin"

const DEFAULT_CAKTO_PRODUCT_ID = "3263gsd_647430"
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
    process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID ?? process.env.CAKTO_PRODUCT_ID ?? DEFAULT_CAKTO_PRODUCT_ID,
  )
}

function getAdminClient() {
  return createAdminClient()
}

type UserSummary = {
  id: string
  email: string
  name?: string | null
  planType: string
  subscriptionStatus: string
  expiresAt?: string | null
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

async function findUserByEmail(email: string): Promise<UserSummary | null> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return null
  }

  const admin = getAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, name, plan_type, subscription_status, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle<{
      id: string
      email: string | null
      name: string | null
      plan_type: string | null
      subscription_status: string | null
      expires_at: string | null
    }>()

  if (profileError) {
    console.error("[cakto] falha ao buscar profile:", profileError)
  }

  if (profile) {
    return {
      id: profile.id,
      email: profile.email ?? normalizedEmail,
      name: profile.name ?? null,
      planType: profile.plan_type ?? "free",
      subscriptionStatus: profile.subscription_status ?? "free",
      expiresAt: profile.expires_at ?? null,
    }
  }

  try {
    const { data: { users }, error: adminError } = await admin.auth.admin.listUsers()
    if (adminError) {
      console.error("[cakto] falha ao buscar auth.users:", adminError)
      return null
    }
    const user = users?.find((u) => u.email?.toLowerCase() === normalizedEmail) || null
    if (!user) {
      return null
    }

  return {
    id: user!.id,
    email: user!.email ?? normalizedEmail,
    name: user!.user_metadata?.name ?? null,
    planType: "free",
    subscriptionStatus: "free",
    expiresAt: null,
  }
  } catch (error) {
    console.error("[cakto] erro ao buscar usuário:", error)
    return null
  }
}

export function generateCheckoutUrl(userEmail: string, customData: Record<string, string> = {}) {
  const normalizedEmail = normalizeEmail(userEmail)
  if (!normalizedEmail) {
    throw new Error("E-mail inválido para gerar checkout")
  }

  const productId = resolveProductId()
  if (!PRODUCT_ID_PATTERN.test(productId)) {
    throw new Error("ID de produto Cakto inválido")
  }

  const params = new URLSearchParams({
    email: normalizedEmail,
    ...customData,
  })

  const baseUrl = `https://pay.cakto.com.br/${productId}`
  return `${baseUrl}?${params.toString()}`
}

export async function checkUserSubscription(email: string): Promise<SubscriptionStatusResponse> {
  const user = await findUserByEmail(email)
  if (!user) {
    return { success: false, message: "Usuário não encontrado" }
  }

  return {
    success: true,
    user: {
      email: user.email,
      plan: user.planType,
      subscription_status: user.subscriptionStatus,
      expires_at: user.expiresAt ?? null,
      isPremium: user.planType === "premium",
    },
  }
}

export async function getUserPaymentHistory(
  email: string,
): Promise<PaymentHistoryResponse> {
  const user = await findUserByEmail(email)
  if (!user) {
    return { success: false, message: "Usuário não encontrado" }
  }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from("payment_history")
    .select(
      "transaction_id, amount, currency, status, payment_method, webhook_data, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[cakto] erro ao buscar histórico de pagamentos:", error)
    return { success: false, message: "Erro ao buscar histórico" }
  }

  // Map and filter out entries with null required fields
  const payments: PaymentHistoryEntry[] = (data ?? [])
    .filter((p): p is typeof p & { transaction_id: string; amount: number; currency: string; status: string; created_at: string } =>
      p.transaction_id != null && p.amount != null && p.currency != null && p.status != null && p.created_at != null
    )
    .map((p) => ({
      transaction_id: p.transaction_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      payment_method: p.payment_method,
      webhook_data: p.webhook_data,
      created_at: p.created_at,
    }))

  return { success: true, payments }
}
