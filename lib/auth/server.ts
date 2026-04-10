import { createAuthServer } from "@neondatabase/auth/next/server"

/**
 * Cliente server-side Neon Auth (Better Auth gerenciado).
 * Exige NEON_AUTH_BASE_URL no ambiente.
 */
export const auth = createAuthServer()
