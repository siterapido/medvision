
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MindmapsClient } from "@/components/dashboard/mindmaps-client"

export default async function MindMapsPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch mind maps
    const { data: maps } = await supabase
        .from("mind_map_artifacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <MindmapsClient userId={user.id} maps={maps} />
}
