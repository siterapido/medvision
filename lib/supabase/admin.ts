import type { SupabaseClient } from "@supabase/supabase-js"

import { createNeonDbClient } from "@/lib/supabase/postgres-builder"

let cached: ReturnType<typeof createNeonDbClient> | null = null

/**
 * Cliente “service” para jobs e rotas que precisam ignorar RLS (RLS desativado no Neon).
 */
export function createAdminClient(): SupabaseClient {
  if (!cached) cached = createNeonDbClient()
  return cached as unknown as SupabaseClient
}
