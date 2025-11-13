import { NextRequest, NextResponse } from "next/server"

function extractId(input?: string) {
  const v = (input ?? "").trim()
  if (!v) return null
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const url = new URL(v)
      const parts = url.pathname.split("/").filter(Boolean)
      const last = parts[parts.length - 1] ?? ""
      return /^[A-Za-z0-9_]+$/.test(last) ? last : null
    } catch {
      return null
    }
  }
  return /^[A-Za-z0-9_]+$/.test(v) ? v : null
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("productUrl") ?? undefined
  const idParam = request.nextUrl.searchParams.get("productId") ?? undefined
  const id = extractId(idParam || urlParam || process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID || process.env.CAKTO_PRODUCT_ID)

  if (!id) {
    return NextResponse.json({ error: "ID do produto inválido" }, { status: 400 })
  }

  const productUrl = `https://pay.cakto.com.br/${id}`

  let statusCode = 0
  let active = false
  let reason: string | undefined

  try {
    const res = await fetch(productUrl, { method: "GET", redirect: "follow" })
    statusCode = res.status
    const text = await res.text()
    const notFound = /Produto não encontrado!/i.test(text) || /inativo|bloqueado/i.test(text)
    active = res.ok && !notFound
    reason = notFound ? "PRODUTO_INATIVO_OU_NAO_ENCONTRADO" : undefined
  } catch {
    reason = "ERRO_DE_REDE"
  }

  const secret = process.env.CAKTO_WEBHOOK_SECRET
  const secretPresent = typeof secret === "string" && secret.trim().length > 0

  return NextResponse.json(
    {
      product: { id, url: productUrl, active, statusCode, reason },
      secret: { present: secretPresent },
    },
    { status: active ? 200 : 400 },
  )
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

