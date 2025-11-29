import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { resolveUserRole } from "@/lib/auth/roles"

// Função simples para verificar expiração sem dependências pesadas
function isTrialExpired(endsAt: string | null): boolean {
  if (!endsAt) return true
  return new Date(endsAt) < new Date()
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[middleware] Missing Supabase environment variables")
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userRole = user ? resolveUserRole(undefined, user) : undefined

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/settings", "/profile", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Auth pages that authenticated users shouldn't access
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth pages to their default panel
  if (isAuthPath && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = userRole === "admin" ? "/admin" : "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  // Verificar expiração do Trial para rotas do dashboard
  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Buscar perfil para verificar trial
    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_ends_at, plan_type, trial_started_at")
      .eq("id", user.id)
      .single()

    const hasActivePlan = profile?.plan_type && profile.plan_type !== "free"
    const trialExpired = isTrialExpired(profile?.trial_ends_at)
    const hasTrialStarted = !!profile?.trial_started_at

    // Se não tem plano ativo E (trial expirou OU trial nunca começou mas deveria ter começado)
    // Nota: A ativação do trial acontece no layout, então se não começou ainda, deixamos passar para o layout ativar
    // Mas se já tem trial_started_at e expirou, bloqueia.
    
    if (!hasActivePlan && hasTrialStarted && trialExpired) {
      // Rotas permitidas mesmo com trial expirado (upgrade, assinatura, perfil, api)
      const allowedPaths = [
        "/dashboard/upgrade",
        "/dashboard/assinatura", 
        "/dashboard/perfil",
        "/api" // Permitir chamadas de API
      ]
      
      const isAllowedPath = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path))

      if (!isAllowedPath) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/dashboard/upgrade"
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
