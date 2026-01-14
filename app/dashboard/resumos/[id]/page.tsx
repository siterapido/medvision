import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SummaryViewer } from "./summary-viewer"

interface SummaryPageProps {
    params: {
        id: string
    }
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function SummaryPage({ params, searchParams }: SummaryPageProps) {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    const { id } = await params

    // Fetch summary
    const { data: summary, error: summaryError } = await supabase
        .from("summaries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

    if (summaryError || !summary) {
        redirect("/dashboard/resumos")
    }

    // Fetch flashcards
    const { data: flashcards } = await supabase
        .from("flashcards")
        .select("id, front, back")
        .eq("summary_id", id)

    // Fetch mind map
    const { data: mindMap } = await supabase
        .from("mind_maps")
        .select("structure")
        .eq("summary_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    return (
        <SummaryViewer
            summary={summary}
            userId={user.id}
            initialFlashcards={flashcards || []}
            initialMindMap={mindMap?.structure || null}
            triggerGeneration={searchParams.trigger === "true"}
        />
    )
}
