"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type ArtifactType =
    | 'research_artifacts'
    | 'summaries'
    | 'flashcard_decks'
    | 'mind_map_artifacts'
    | 'notes'

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


        return { success: true }
    } catch (error) {
        console.error("Unexpected error deleting artifact:", error)
        return { error: "An unexpected error occurred" }
    }
}

export async function saveNote(content: string, originMessageId?: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not authenticated" }
    }

    try {
        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: user.id,
                content: content,
                origin_message_id: originMessageId
            })
            .select()
            .single()

        if (error) {
            console.error("Error saving note:", error)
            return { error: "Failed to save note" }
        }

        revalidatePath("/dashboard/notas")
        return { success: true, note: data }
    } catch (error) {
        console.error("Unexpected error saving note:", error)
        return { error: "An unexpected error occurred" }
    }
}
