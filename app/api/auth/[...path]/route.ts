/**
 * Proxy de autenticação → Neon Auth (Better Auth gerenciado).
 *
 * Por que proxy customizado?
 * O authApiHandler() do SDK encaminha o header `Origin` do browser tal como está.
 * O servidor Neon Auth valida esse Origin contra `trusted_origins` (INVALID_ORIGIN 403).
 * Como o Next.js já é o limite de confiança (CSRF é gerenciado aqui), é seguro
 * substituir o Origin pelo endereço do próprio servidor Neon antes de encaminhar.
 */

import { appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

export const runtime = "nodejs"

const NEON_BASE =
  process.env.NEON_AUTH_BASE_URL?.trim() ||
  // fallback: alguns deploys configuram apenas a versão NEXT_PUBLIC
  process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL?.trim()

/**
 * Em http://localhost (e rede local) muitos browsers aceitam cookies `Secure` (contexto
 * confiável). O Neon Auth usa prefixo `__Secure-`: remover `Secure` quebra a regra do
 * prefixo e o browser descarta o cookie. Aqui só relaxamos o que é seguro (Partitioned;
 * SameSite=None → Lax) e só removemos `Secure` em cookies *sem* prefixo __Secure/__Host.
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
  const name = cookie.split("=")[0]?.trim() ?? ""
  const isStrictPrefix = name.startsWith("__Secure-") || name.startsWith("__Host-")
  let out = cookie.replace(/;\s*Partitioned/gi, "")
  if (!isStrictPrefix) {
    out = out.replace(/;\s*Secure/gi, "")
  }
  out = out.replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
  return out
}

function debugAuthLog(data: Record<string, unknown>) {
  const dir = join(process.cwd(), ".cursor")
  const file = join(dir, "debug-9ee8f9.log")
  try {
    mkdirSync(dir, { recursive: true })
    appendFileSync(
      file,
      `${JSON.stringify({ sessionId: "9ee8f9", timestamp: Date.now(), ...data })}\n`,
    )
  } catch (e) {
    console.error("[api/auth proxy] debugAuthLog:", e)
  }
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
  try {
  if (!NEON_BASE) {
    // #region agent log
    fetch("http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9ee8f9" },
      body: JSON.stringify({
        sessionId: "9ee8f9",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "api/auth/[...path]:missing-NEON_BASE",
        message: "NEON_AUTH_BASE_URL missing",
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34a8c1'},body:JSON.stringify({sessionId:'34a8c1',runId:'pre-fix',hypothesisId:'P1',location:'app/api/auth/[...path]/route.ts:missing_neon_base',message:'neon_auth_proxy.missing_base',data:{nodeEnv:process.env.NODE_ENV??null,hasPublicFallback:Boolean(process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL?.trim())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return missing()
  }

  const { path } = await ctx.params
  const base = NEON_BASE.endsWith("/") ? NEON_BASE : `${NEON_BASE}/`
  const target = new URL(path.join("/"), base)
  target.search = new URL(request.url).search

  // Copia headers omitindo os que causam rejeição no Neon Auth e hop-by-hop (RFC 7230).
  // Sem isso, `transfer-encoding`/`content-length` vindos do browser podem conflitar com
  // o body já materializado e gerar 5xx no upstream.
  const STRIP = new Set([
    "origin",
    "host",
    "x-forwarded-host",
    "x-forwarded-for",
    "x-real-ip",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-connection",
    "upgrade",
    "te",
  ])
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
  if (hasBody) {
    headers.delete("content-length")
  }

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body,
  })

  // #region agent log
  const reqUrl = new URL(request.url)
  let upstreamPreview: string | null = null
  if (upstream.status >= 400) {
    try {
      upstreamPreview = (await upstream.clone().text()).slice(0, 800)
    } catch {
      upstreamPreview = "(could not read body)"
    }
  }
  const h3Payload = {
    runId: "post-fix",
    hypothesisId: "H3",
    location: "api/auth/[...path]:upstream",
    message: "auth proxy upstream response",
    data: {
      method: request.method,
      pathJoined: path.join("/"),
      upstreamStatus: upstream.status,
      relaxCookies: shouldRelaxAuthCookieSecurity(request.url),
      reqHost: reqUrl.hostname,
      targetHost: target.hostname,
      targetPath: `${target.pathname}${target.search}`,
      upstreamPreview,
    },
  }
  debugAuthLog(h3Payload)
  fetch("http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9ee8f9" },
    body: JSON.stringify({
      sessionId: "9ee8f9",
      ...h3Payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // #region agent log
  fetch('http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34a8c1'},body:JSON.stringify({sessionId:'34a8c1',runId:'pre-fix',hypothesisId:'P2',location:'app/api/auth/[...path]/route.ts:upstream',message:'neon_auth_proxy.upstream',data:{method:request.method,upstreamStatus:upstream.status,reqHost:reqUrl.hostname,targetHost:target.hostname,targetPath:`${target.pathname}${target.search}`},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    debugAuthLog({
      runId: "post-fix",
      hypothesisId: "H7",
      location: "api/auth/[...path]:catch",
      message: "auth proxy threw",
      data: { error: msg.slice(0, 500) },
    })
    console.error("[api/auth proxy]", e)
    return new Response(JSON.stringify({ error: "auth_proxy_error", detail: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  }
}

export const GET    = proxy
export const POST   = proxy
export const PUT    = proxy
export const DELETE = proxy
export const PATCH  = proxy
