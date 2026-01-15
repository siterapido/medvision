"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type ArtifactType =
    | 'research_artifacts'
    | 'summaries'
    | 'flashcard_decks'
    | 'mind_map_artifacts'

export async function deleteArtifact(id: string, type: ArtifactType) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    try {
        const { error } = await supabase
            .from(type)
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            console.error("Error deleting artifact:", error)
            return { error: "Failed to delete artifact" }
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/pesquisas")
        revalidatePath("/dashboard/resumos")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error deleting artifact:", error)
        return { error: "An unexpected error occurred" }
    }
}
