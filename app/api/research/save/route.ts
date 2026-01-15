
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { userId, query, content, sources, type } = await req.json()

        if (!userId || !content) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Generate a title from the query
        const title = query.length > 50 ? query.substring(0, 50) + "..." : query

        const { data, error } = await supabase
            .from("research_artifacts")
            .insert({
                user_id: userId,
                title: title,
                query: query,
                content: content,
                sources: sources || [],
                type: type || "research",
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json(
                { error: "Failed to save research" },
                { status: 500 }
            )
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error("Server error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
