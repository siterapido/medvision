import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type {
  PaymentHistoryEntry,
  PaymentHistoryResponse,
  SubscriptionStatusResponse,
} from "@/lib/cakto"

function normalizeEmail(email?: string) {
  if (!email) {
    return null
  }

  const trimmed = email.trim().toLowerCase()
  return trimmed === "" ? null : trimmed
}

type UserSummary = {
  id: string
  email: string
  name?: string | null
  planType: string
  subscriptionStatus: string
  expiresAt?: string | null
}

function getAdminClient() {
  return createAdminClient()
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

  return null
}

export async function checkUserSubscription(
  email: string,
): Promise<SubscriptionStatusResponse> {
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

  const payments: PaymentHistoryEntry[] = (data ?? [])
    .filter(
      (
        p,
      ): p is typeof p & {
        transaction_id: string
        amount: number
        currency: string
        status: string
        created_at: string
      } =>
        p.transaction_id != null &&
        p.amount != null &&
        p.currency != null &&
        p.status != null &&
        p.created_at != null,
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
