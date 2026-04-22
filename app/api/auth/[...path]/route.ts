/**
 * Proxy de autenticação → Neon Auth (Better Auth gerenciado).
 *
 * Por que proxy customizado?
 * O authApiHandler() do SDK encaminha o header `Origin` do browser tal como está.
 * O servidor Neon Auth valida esse Origin contra `trusted_origins` (INVALID_ORIGIN 403).
 * Como o Next.js já é o limite de confiança (CSRF é gerenciado aqui), é seguro
 * substituir o Origin pelo endereço do próprio servidor Neon antes de encaminhar.
 */

const NEON_BASE = process.env.NEON_AUTH_BASE_URL?.trim()

/**
 * Em http://localhost o browser ignora cookies com flag Secure; o Neon Auth costuma
 * enviar Secure em ambientes HTTPS. Remove Secure e ajusta SameSite para a sessão
 * persistir no dev local.
 */
function shouldRelaxAuthCookieSecurity(requestUrl: string): boolean {
  if (process.env.NODE_ENV !== "development") return false
  try {
    const { protocol, hostname } = new URL(requestUrl)
    if (protocol !== "http:") return false
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true
    if (hostname.endsWith(".local")) return true
    if (hostname === "0.0.0.0") return true
    if (/^10\./.test(hostname)) return true
    if (/^192\.168\./.test(hostname)) return true
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true
    return false
  } catch {
    return false
  }
}

function relaxSetCookieForInsecureLocalhost(cookie: string): string {
  return cookie
    .replace(/;\s*Partitioned/gi, "")
    .replace(/;\s*Secure/gi, "")
    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
}

function missing() {
  return new Response(
    JSON.stringify({
      error:
        "NEON_AUTH_BASE_URL não configurado. Defina no .env.local ou nas env vars da Vercel.",
    }),
    { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } },
  )
}

async function proxy(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (!NEON_BASE) return missing()

  const { path } = await ctx.params
  const base = NEON_BASE.endsWith("/") ? NEON_BASE : `${NEON_BASE}/`
  const target = new URL(path.join("/"), base)
  target.search = new URL(request.url).search

  // Copia headers omitindo os que causam rejeição no Neon Auth:
  // - origin/host: redefinidos abaixo com o endereço do servidor Neon
  // - x-forwarded-host: injetado pela Vercel com nosso domínio → INVALID_HOSTNAME
  // - x-forwarded-for / x-real-ip: podem conflitar com validações do Neon Auth
  const STRIP = new Set(["origin", "host", "x-forwarded-host", "x-forwarded-for", "x-real-ip"])
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) headers.set(key, value)
  })
  // Define origin como o próprio servidor Neon → passa na verificação INVALID_ORIGIN
  // Origin deve ser apenas scheme+host (sem path), ex: https://ep-xxx.neonauth.region.aws.neon.tech
  const neonOrigin = new URL(NEON_BASE).origin
  headers.set("origin", neonOrigin)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const body = hasBody ? await request.arrayBuffer() : undefined

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body,
  })

  // Encaminha a resposta ao browser preservando headers. Vários `Set-Cookie` exigem
  // append — usar set() descarta todos exceto o último e quebra a sessão.
  const resHeaders = new Headers()
  const relaxCookies = shouldRelaxAuthCookieSecurity(request.url)
  upstream.headers.forEach((value, key) => {
    const lk = key.toLowerCase()
    if (lk === "transfer-encoding") return
    if (lk === "set-cookie") {
      const v = relaxCookies ? relaxSetCookieForInsecureLocalhost(value) : value
      resHeaders.append("Set-Cookie", v)
      return
    }
    resHeaders.set(key, value)
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}

export const GET    = proxy
export const POST   = proxy
export const PUT    = proxy
export const DELETE = proxy
export const PATCH  = proxy
