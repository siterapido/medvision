
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImagensClient } from "@/components/dashboard/imagens-client"

export default async function ImagensPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch image analysis artifacts
    const { data: artifacts } = await supabase
        .from("image_artifacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <ImagensClient userId={user.id} artifacts={artifacts} />
}
