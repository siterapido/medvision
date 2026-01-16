
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotasClient } from "@/components/dashboard/notas-client"

export default async function NotasPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch notes
    const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <NotasClient userId={user.id} notes={notes} />
}
