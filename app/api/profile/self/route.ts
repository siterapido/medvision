import { neonAuth } from "@neondatabase/auth/next/server"
import { NextResponse } from "next/server"

import { getSql } from "@/lib/db/pool"

/**
 * Perfil do usuário autenticado (substitui .from('profiles') no browser).
 */
export async function GET() {
  const { user } = await neonAuth()
  // #region agent log
  fetch("http://127.0.0.1:7488/ingest/88ff5270-51f7-4fd2-964b-ba8036bb3567", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9ee8f9" },
    body: JSON.stringify({
      sessionId: "9ee8f9",
      runId: "pre-fix",
      hypothesisId: "H4",
      location: "api/profile/self:GET",
      message: "neonAuth in profile self",
      data: { hasUser: !!user },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
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
