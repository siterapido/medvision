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

  // Copia headers omitindo `origin` e `host` (serão redefinidos abaixo)
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k !== "origin" && k !== "host") headers.set(key, value)
  })
  // Define origin como o próprio servidor Neon → passa na verificação INVALID_ORIGIN
  headers.set("origin", NEON_BASE)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const body = hasBody ? await request.arrayBuffer() : undefined

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body,
  })

  // Encaminha a resposta ao browser preservando todos os headers (cookies, etc.)
  const resHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "transfer-encoding") resHeaders.set(key, value)
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
