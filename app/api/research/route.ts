import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "50")
        const offset = parseInt(searchParams.get("offset") || "0")

        const { data: researches, error } = await supabase
            .from("research_artifacts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ researches })
    } catch (error) {
        console.error("Error fetching researches:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { title, content, query, sources, type } = body

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from("research_artifacts")
            .insert({
                user_id: user.id,
                title,
                content,
                query: query || "",
                sources: sources || [],
                type: type || "literature_review",
                status: "completed"
            })
            .select()
            .single()

        if (error) {
            console.error("Database error:", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ research: data }, { status: 201 })
    } catch (error) {
        console.error("Error creating research:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "Research ID is required" },
                { status: 400 }
            )
        }

        const { error } = await supabase
            .from("research_artifacts")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting research:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
