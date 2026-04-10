import { neonAuth } from "@neondatabase/auth/next/server"
import { NextResponse } from "next/server"

import { getSql } from "@/lib/db/pool"

/**
 * Perfil do usuário autenticado (substitui .from('profiles') no browser).
 */
export async function GET() {
  const { user } = await neonAuth()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const sql = getSql()
  const rows = await sql.query(
    `SELECT id, role, name, avatar_url, plan_type, subscription_status, trial_ends_at, pipeline_stage, email FROM public.profiles WHERE id = $1 LIMIT 1`,
    [user.id],
  )
  const row = (rows as Record<string, unknown>[])[0] ?? null
  return NextResponse.json(row)
}
