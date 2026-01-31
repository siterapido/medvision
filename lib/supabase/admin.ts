import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

const cachedAdminClients = new Map<string, ReturnType<typeof createClient<Database>>>()

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)")
  }

  if (/\s/.test(serviceRoleKey)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY contém espaços ou quebras de linha extras. Remova qualquer formatação.")
  }

  if (!cachedAdminClients.has(serviceRoleKey)) {
    cachedAdminClients.set(
      serviceRoleKey,
      createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    )
  }

  return cachedAdminClients.get(serviceRoleKey)!
}
