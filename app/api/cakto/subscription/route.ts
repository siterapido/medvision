import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { checkUserSubscription } from "@/lib/cakto"

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()

  const emailParam = request.nextUrl.searchParams.get("email")
  const email = (emailParam?.trim() || authData?.user?.email)?.trim() ?? undefined

  if (!email) {
    return NextResponse.json({ success: false, message: "Informe o e-mail" }, { status: 400 })
  }

  const result = await checkUserSubscription(email)
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
