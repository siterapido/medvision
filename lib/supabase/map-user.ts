import type { User } from "@supabase/supabase-js"

/** Campos mínimos vindos do Neon Auth / Better Auth */
export type NeonLikeUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  emailVerified?: boolean
}

/**
 * Mantém compatibilidade com código que esperava `User` do Supabase Auth.
 */
export function mapNeonUserToSupabaseUser(u: NeonLikeUser): User {
  return {
    id: u.id,
    email: u.email ?? "",
    app_metadata: {},
    user_metadata: {
      full_name: u.name,
      name: u.name,
      avatar_url: u.image,
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: "authenticated",
    email_confirmed_at: u.emailVerified ? new Date().toISOString() : undefined,
  } as User
}
