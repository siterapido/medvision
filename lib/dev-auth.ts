import type { NextRequest } from "next/server"

import type { NeonLikeUser } from "@/lib/supabase/map-user"

/** Cookie httpOnly definido por `GET /dev/medvision` em `next dev` */
export const DEV_BYPASS_COOKIE_NAME = "__dev_medvision_bypass"

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Aceita true, 1, yes, on (case-insensitive).
 * Evita falha quando o valor não é exatamente a string "true".
 */
export function parseDevBypassEnvFlag(): boolean {
  const v = process.env.DEV_BYPASS_AUTH?.trim().toLowerCase()
  return v === "true" || v === "1" || v === "yes" || v === "on"
}

/**
 * Bypass via proxy (Edge): env e/ou cookie no request.
 * Não importe `next/headers` aqui — quebra o bundle do proxy.
 */
export function isDevProxyBypass(request: NextRequest): boolean {
  if (!isDevEnvironment()) return false
  if (parseDevBypassEnvFlag()) return true
  return request.cookies.get(DEV_BYPASS_COOKIE_NAME)?.value === "1"
}

/** Usuário sintético compatível com `mapNeonUserToSupabaseUser` */
export function getDevBypassNeonUser(): NeonLikeUser {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "dev@local.medvision",
    name: "Dev (sem auth)",
    emailVerified: true,
  }
}
