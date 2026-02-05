import { NextRequest, NextResponse } from "next/server"
import { generateCheckoutUrl, CAKTO_BASIC_ANNUAL_PLAN_ID, CAKTO_PRO_ANNUAL_PLAN_ID, CAKTO_CERTIFICATE_ID } from "@/lib/cakto"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type CheckoutPayload = {
  email?: string
  plan?: 'basic' | 'pro' | 'certificate'
  customData?: Record<string, unknown>
}

function normalizeCustomData(value: Record<string, unknown> | undefined) {
  if (!value || typeof value !== "object") {
    return {}
  }

  return Object.entries(value).reduce<Record<string, string>>((acc, [key, entry]) => {
    if (!key) return acc
    acc[key] = typeof entry === "string" ? entry : String(entry ?? "")
    return acc
  }, {})
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()

  let payload: CheckoutPayload = {}
  try {
    payload = (await request.json()) as CheckoutPayload
  } catch (error) {
    console.info("[cakto/checkout-url] body inválido, usando defaults", error)
  }

  const email = payload.email?.trim() || authData?.user?.email || undefined
  if (!email) {
    return NextResponse.json({ error: "Informe um e-mail" }, { status: 400 })
  }

  let productId = CAKTO_BASIC_ANNUAL_PLAN_ID
  if (payload.plan === 'pro') {
    productId = CAKTO_PRO_ANNUAL_PLAN_ID
  } else if (payload.plan === 'certificate') {
    productId = CAKTO_CERTIFICATE_ID
  }

  // Se houver um course_id no customData, tentamos buscar o ID do produto específico
  const customData = normalizeCustomData(payload.customData)
  const courseId = customData.course_id

  if (courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("cakto_product_id")
      .eq("id", courseId)
      .single()

    if (course?.cakto_product_id) {
      productId = course.cakto_product_id
    }
  }

  const url = generateCheckoutUrl(email, customData, productId)
  return NextResponse.json({ url })
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
