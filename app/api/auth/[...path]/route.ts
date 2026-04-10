import { authApiHandler } from "@neondatabase/auth/next/server"

type AuthHandlers = ReturnType<typeof authApiHandler>

let cachedHandlers: AuthHandlers | null = null

function getHandlers(): AuthHandlers | null {
  if (!process.env.NEON_AUTH_BASE_URL?.trim()) {
    return null
  }
  if (!cachedHandlers) {
    cachedHandlers = authApiHandler()
  }
  return cachedHandlers
}

function envAusenteResponse() {
  return new Response(
    JSON.stringify({
      error:
        "NEON_AUTH_BASE_URL não configurado. Defina a URL de Auth do Neon (Console → Auth → Configuration).",
    }),
    { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } },
  )
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const h = getHandlers()
  if (!h) return envAusenteResponse()
  return h.GET(request, ctx)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const h = getHandlers()
  if (!h) return envAusenteResponse()
  return h.POST(request, ctx)
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const h = getHandlers()
  if (!h) return envAusenteResponse()
  return h.PUT(request, ctx)
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const h = getHandlers()
  if (!h) return envAusenteResponse()
  return h.DELETE(request, ctx)
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const h = getHandlers()
  if (!h) return envAusenteResponse()
  return h.PATCH(request, ctx)
}
