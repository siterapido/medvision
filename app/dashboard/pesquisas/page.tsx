
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PesquisasClient } from "@/components/dashboard/pesquisas-client"

export default async function PesquisasPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch researches
    const { data: researches } = await supabase
        .from("research_artifacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <PesquisasClient userId={user.id} researches={researches} />
}
