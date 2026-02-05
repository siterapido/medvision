/**
 * Admin API endpoint for Z-API instance status
 *
 * Returns the current connection status of the Z-API WhatsApp instance,
 * including whether the smartphone is connected and session details.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"
import { getInstanceStatus, isZApiConfigured } from "@/lib/zapi"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Verify admin authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (resolveUserRole(profile?.role, user) !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // Check if Z-API is configured
    if (!isZApiConfigured()) {
      return NextResponse.json({
        configured: false,
        connected: false,
        error: "Z-API environment variables not configured",
      })
    }

    // Get instance status from Z-API
    const status = await getInstanceStatus()

    return NextResponse.json({
      configured: true,
      ...status,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Admin Z-API Status] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
