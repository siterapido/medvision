import { NextResponse, type NextRequest } from "next/server"

import { isDevProxyBypass } from "@/lib/dev-auth"
import { mapNeonUserToSupabaseUser, type NeonLikeUser } from "@/lib/supabase/map-user"
import { resolveUserRole } from "@/lib/auth/roles"

async function fetchNeonSessionUser(request: NextRequest): Promise<NeonLikeUser | null> {
  try {
    const base = process.env.NEON_AUTH_BASE_URL?.trim()
    if (!base) {
      console.error("[proxy] NEON_AUTH_BASE_URL ausente")
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
    redirectUrl.pathname = staff ? "/admin" : "/dashboard/med-vision"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|\\.well-known/workflow/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
