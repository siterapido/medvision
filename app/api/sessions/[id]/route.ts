import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/sessions/[id]
 * Get a specific session with its messages
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Fetch session with messages
    const { data: session, error } = await supabase
      .from("agent_sessions")
      .select(
        `
        *,
        agent_messages(*)
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[Sessions] Error fetching session:", error)
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Transform session data
    const transformedSession = {
      id: session.id,
      agentType: session.agent_type,
      status: session.status,
      metadata: session.metadata,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: session.agent_messages?.map((msg: any) => ({
        id: msg.id,
        agentId: msg.agent_id,
        role: msg.role,
        content: msg.content,
        toolCalls: msg.tool_calls,
        toolResults: msg.tool_results,
        metadata: msg.metadata,
        createdAt: msg.created_at,
      })) || [],
    }

    return NextResponse.json({ session: transformedSession })
  } catch (error) {
    console.error("[Sessions] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions/[id]
 * Delete a specific session
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Delete session (cascade will delete messages)
    const { error } = await supabase
      .from("agent_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[Sessions] Error deleting session:", error)
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Sessions] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sessions/[id]
 * Update session metadata or status
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, metadata } = body

    // Build update object
    const updateData: any = {}
    if (status) updateData.status = status
    if (metadata) updateData.metadata = metadata

    // Update session
    const { data: session, error } = await supabase
      .from("agent_sessions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[Sessions] Error updating session:", error)
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
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
