import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getUserPaymentHistory } from "@/lib/cakto"

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()

  const emailParam = request.nextUrl.searchParams.get("email")
  const email = (emailParam?.trim() || authData?.user?.email)?.trim() ?? undefined

  if (!email) {
    return NextResponse.json({ success: false, message: "Informe o e-mail" }, { status: 400 })
  }

  const result = await getUserPaymentHistory(email)
  const status = result.success ? 200 : result.message === "Usuário não encontrado" ? 404 : 500
  return NextResponse.json(result, { status })
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
