
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FlashcardsClient } from "@/components/dashboard/flashcards-client"

export default async function FlashcardsPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch flashcard decks
    const { data: decks } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <FlashcardsClient userId={user.id} decks={decks} />
}
