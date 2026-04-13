import { neonAuth } from "@neondatabase/auth/next/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const FALLBACK_PATH = "/dashboard"

export function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath) return FALLBACK_PATH
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return FALLBACK_PATH
  return nextPath
}

/**
 * Callback OAuth: valida a sessão após retorno do provider.
 * Para login email/senha o Neon Auth não usa este callback —
 * ele é necessário apenas para fluxos OAuth (Google, GitHub, etc.).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"))

  try {
    const { user } = await neonAuth()
    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_error", requestUrl.origin),
      )
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err)
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_error", requestUrl.origin),
    )
  }
}
