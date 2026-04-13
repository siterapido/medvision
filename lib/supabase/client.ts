"use client"

import { createAuthClient } from "@neondatabase/auth"
import { SupabaseAuthAdapter } from "@neondatabase/auth/vanilla"
import type { SupabaseClient } from "@supabase/supabase-js"

let adapter: ReturnType<typeof createAuthClient> | null = null

function getNeonAuthBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL) {
    return process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  // Dev local: aponta para a própria aplicação para que os cookies
  // sejam setados no domínio correto via proxy /api/auth/[...path]
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://localhost:3000"
}

function getSupabaseCompatibleAuth() {
  if (!adapter) {
    adapter = createAuthClient(getNeonAuthBaseUrl(), {
      adapter: SupabaseAuthAdapter(),
    }) as ReturnType<typeof createAuthClient>
  }
  return adapter
}

/**
 * Cliente browser: API compatível com Supabase Auth (`auth.signInWithPassword`, etc.).
 * Dados em `public.*` devem ser acessados via rotas API ou server actions (sem PostgREST).
 */
export function createClient(): SupabaseClient {
  const auth = getSupabaseCompatibleAuth()
  return {
    auth,
    from: (_table: string) => {
      throw new Error(
        "Consultas ao Postgres no cliente não estão disponíveis. Use rotas em /api ou server actions.",
      )
    },
  } as unknown as SupabaseClient
}
