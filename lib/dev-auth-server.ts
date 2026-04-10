import "server-only"

import { cookies } from "next/headers"

import {
  DEV_BYPASS_COOKIE_NAME,
  getDevBypassNeonUser,
  isDevEnvironment,
  parseDevBypassEnvFlag,
} from "@/lib/dev-auth"
import { mapNeonUserToSupabaseUser } from "@/lib/supabase/map-user"

/**
 * Bypass em Server Components, Server Actions e Route Handlers:
 * mesma regra do proxy (env) + cookie definido em `GET /dev/medvision`.
 */
export async function isDevServerBypass(): Promise<boolean> {
  if (!isDevEnvironment()) return false
  if (parseDevBypassEnvFlag()) return true
  try {
    const store = await cookies()
    return store.get(DEV_BYPASS_COOKIE_NAME)?.value === "1"
  } catch {
    return false
  }
}

export async function getDevBypassUserIfActive() {
  if (!(await isDevServerBypass())) return null
  return mapNeonUserToSupabaseUser(getDevBypassNeonUser())
}
