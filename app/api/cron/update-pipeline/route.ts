import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cron job para atualizar estágios do pipeline automaticamente
// Executa diariamente às 7h00

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    // 1. Marcar usuários inativos há 3+ dias como risco_churn
    // (que não estão convertidos ou perdidos)
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from("profiles")
      .update({
        pipeline_stage: "risco_churn",
        updated_at: now.toISOString()
      })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .not("trial_started_at", "is", null)
      .lt("last_active_at", threeDaysAgo.toISOString())
      .not("pipeline_stage", "in", '("convertido","perdido","risco_churn")')
      .eq("plan_type", "free")
      .select("id")

    const inactiveCount = inactiveUsers?.length || 0

    // 2. Marcar trials expirados como perdido
    // (que não estão convertidos)
    const { data: expiredUsers, error: expiredError } = await supabase
      .from("profiles")
      .update({
        pipeline_stage: "perdido",
        updated_at: now.toISOString()
      })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .not("trial_ends_at", "is", null)
      .lt("trial_ends_at", now.toISOString())
      .neq("pipeline_stage", "convertido")
      .neq("pipeline_stage", "perdido")
      .eq("plan_type", "free")
      .select("id")

    const expiredCount = expiredUsers?.length || 0

    // 3. Marcar usuários com trial acabando (2 dias ou menos) como barreira_plano
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const { data: barrierUsers, error: barrierError } = await supabase
      .from("profiles")
      .update({
        pipeline_stage: "barreira_plano",
        updated_at: now.toISOString()
      })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .not("trial_ends_at", "is", null)
      .gt("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", twoDaysFromNow.toISOString())
      .not("pipeline_stage", "in", '("convertido","perdido","risco_churn","barreira_plano")')
      .eq("plan_type", "free")
      .select("id")

    const barrierCount = barrierUsers?.length || 0

    // 4. Atualizar last_active_at para usuários que estiveram ativos nas últimas 24h
    // (baseado em chat_messages ou agent_sessions)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Buscar usuários com atividade recente em chat_messages
    const { data: activeFromChat } = await supabase
      .from("chat_messages")
      .select("user_id")
      .gte("created_at", oneDayAgo.toISOString())
      .not("user_id", "is", null)

    // Buscar usuários com atividade recente em agent_sessions
    const { data: activeFromSessions } = await supabase
      .from("agent_sessions")
      .select("user_id")
      .gte("updated_at", oneDayAgo.toISOString())

    // Combinar IDs únicos
    const activeUserIds = [
      ...new Set([
        ...(activeFromChat?.map(c => c.user_id) || []),
        ...(activeFromSessions?.map(s => s.user_id) || [])
      ])
    ].filter(Boolean)

    let activityUpdatedCount = 0
    if (activeUserIds.length > 0) {
      const { data: updatedActivity } = await supabase
        .from("profiles")
        .update({ last_active_at: now.toISOString() })
        .in("id", activeUserIds)
        .select("id")

      activityUpdatedCount = updatedActivity?.length || 0
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      updates: {
        risco_churn: inactiveCount,
        perdido: expiredCount,
        barreira_plano: barrierCount,
        last_active_at_updated: activityUpdatedCount
      },
      errors: {
        inactive: inactiveError?.message,
        expired: expiredError?.message,
        barrier: barrierError?.message
      }
    }

    console.log("[cron/update-pipeline] Pipeline atualizado:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[cron/update-pipeline] Erro:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
