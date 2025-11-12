import { createAdminClient } from "@/lib/supabase/admin"

const CAKTO_PRODUCT_ID =
  process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID ?? process.env.CAKTO_PRODUCT_ID ?? "sx9y8uk_642731"
const CAKTO_BASE_URL = `https://pay.cakto.com.br/${CAKTO_PRODUCT_ID}`

const ADMIN_CLIENT = createAdminClient()

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

  const { data: profile, error: profileError } = await ADMIN_CLIENT
    .from("profiles")
    .select("id, email, name, plan_type, subscription_status, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle()

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

  const { data: adminData, error: adminError } = await ADMIN_CLIENT.auth.admin.getUserByEmail(
    normalizedEmail,
  )

  if (adminError) {
    console.error("[cakto] falha ao buscar auth.user:", adminError)
    return null
  }

  const user = adminData?.user
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? normalizedEmail,
    name: user.user_metadata?.name ?? null,
    planType: "free",
    subscriptionStatus: "free",
    expiresAt: null,
  }
}

export function generateCheckoutUrl(userEmail: string, customData: Record<string, string> = {}) {
  const normalizedEmail = normalizeEmail(userEmail)
  if (!normalizedEmail) {
    throw new Error("E-mail inválido para gerar checkout")
  }

  const params = new URLSearchParams({
    email: normalizedEmail,
    ...customData,
  })

  return `${CAKTO_BASE_URL}?${params.toString()}`
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

  const { data, error } = await ADMIN_CLIENT
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

  return { success: true, payments: data ?? [] }
}
