import { NextResponse, type NextRequest } from "next/server"

import { isDevProxyBypass } from "@/lib/dev-auth"
import { mapNeonUserToSupabaseUser, type NeonLikeUser } from "@/lib/supabase/map-user"
import { resolveUserRole } from "@/lib/auth/roles"

async function fetchNeonSessionUser(request: NextRequest): Promise<NeonLikeUser | null> {
  try {
    const base = process.env.NEON_AUTH_BASE_URL?.trim()
    if (!base) {
      console.error("[proxy] NEON_AUTH_BASE_URL ausente")
      // #region agent log
      fetch("http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9ee8f9" },
        body: JSON.stringify({
          sessionId: "9ee8f9",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "proxy.ts:fetchNeonSessionUser",
          message: "NEON_AUTH_BASE_URL missing in proxy",
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      return null
    }
    const url = new URL("get-session", base.endsWith("/") ? base : `${base}/`)
    const res = await fetch(url.toString(), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    })
    const body = (await res.json().catch(() => null)) as {
      user?: NeonLikeUser
      session?: { user?: NeonLikeUser }
    } | null
    if (!body) return null
    const user = body.user ?? body.session?.user ?? null
    // #region agent log
    const hasCookieHeader = (request.headers.get("cookie") ?? "").length > 0
    fetch("http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9ee8f9" },
      body: JSON.stringify({
        sessionId: "9ee8f9",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "proxy.ts:get-session",
        message: "Neon get-session result",
        data: {
          status: res.status,
          hasUser: !!user,
          hasCookieHeader,
          path: request.nextUrl.pathname,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return user
  } catch (e) {
    console.error("[proxy] fetchNeonSessionUser falhou:", e)
    return null
  }
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  // Não chama get-session no Neon durante o proxy de auth local — evita trabalho extra,
  // timeouts e qualquer falha de rede que derrubaria o POST /api/auth/* com 500.
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const user = await fetchNeonSessionUser(request)
  const mapped = user ? mapNeonUserToSupabaseUser(user) : null
  const userRole = mapped ? resolveUserRole(undefined, mapped) : undefined

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const protectedPaths = ["/dashboard", "/settings", "/profile", "/admin", "/newdashboard"]
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  )

  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user && !isDevProxyBypass(request)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPath && user) {
    const redirectUrl = request.nextUrl.clone()
    const staff = userRole === "admin" || userRole === "vendedor"
    redirectUrl.pathname = staff ? "/admin" : "/dashboard/odonto-vision"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
