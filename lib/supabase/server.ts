import { neonAuth } from "@neondatabase/auth/next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

import { mapNeonUserToSupabaseUser, type NeonLikeUser } from "@/lib/supabase/map-user"
import { createNeonDbClient } from "@/lib/supabase/postgres-builder"

const db = createNeonDbClient()

/**
 * Cliente compatível com o antigo Supabase server: `from()`, `rpc()` e `auth.getUser()`.
 * Asserção para `SupabaseClient` preserva tipagem em serviços que ainda esperam o SDK.
 */
export const createClient = cache(async (): Promise<SupabaseClient> => {
  return {
    from: (table: string) => db.from(table),
    rpc: (fn: string, args?: Record<string, unknown>) => db.rpc(fn, args ?? {}),
    auth: {
      getUser: async () => {
        const { user } = await neonAuth()
        if (!user) return { data: { user: null }, error: null }
        return {
          data: { user: mapNeonUserToSupabaseUser(user as NeonLikeUser) },
          error: null,
        }
      },
    },
  } as unknown as SupabaseClient
})

export const getUser = cache(async () => {
  const { user } = await neonAuth()
  if (!user) return null
  return mapNeonUserToSupabaseUser(user as NeonLikeUser)
})
