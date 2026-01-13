import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

/**
 * GET /api/sessions
 * List all agent sessions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const agentType = searchParams.get("agentType") || undefined

    // Build query
    let query = supabase
      .from("agent_sessions")
      .select(
        `
        *,
        agent_messages(count)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by agent type if specified
    if (agentType) {
      query = query.eq("agent_type", agentType)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("[Sessions] Error fetching sessions:", error)
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      )
    }

    // Transform sessions to include message count
    const transformedSessions = sessions?.map((session: any) => ({
      id: session.id,
      agentType: session.agent_type,
      status: session.status,
      metadata: session.metadata,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messageCount: session.agent_messages?.[0]?.count || 0,
    })) || []

    return NextResponse.json({
      sessions: transformedSessions,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[Sessions] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions
 * Create a new agent session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { agentType = "qa", metadata = {} } = body

    // Validate agent type
    const validAgentTypes = ["qa", "image-analysis", "orchestrated"]
    if (!validAgentTypes.includes(agentType)) {
      return NextResponse.json(
        { error: `Invalid agent type. Must be one of: ${validAgentTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Create session
    const { data: session, error } = await supabase
      .from("agent_sessions")
      .insert({
        user_id: user.id,
        agent_type: agentType,
        status: "active",
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error("[Sessions] Error creating session:", error)
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session: {
        id: session.id,
        agentType: session.agent_type,
        status: session.status,
        metadata: session.metadata,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      },
    })
  } catch (error) {
    console.error("[Sessions] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
