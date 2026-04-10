import type { NeonLikeUser } from "@/lib/supabase/map-user"

/**
 * Bypass de login apenas em desenvolvimento local.
 * Ative com `DEV_BYPASS_AUTH=true` no `.env.local` (nunca em produção).
 */
export function isDevAuthBypass(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_BYPASS_AUTH === "true"
  )
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
