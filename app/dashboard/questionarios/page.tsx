
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QuestionariosClient } from "@/components/dashboard/questionarios-client"

export default async function QuestionariosPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch exams
    const { data: exams } = await supabase
        .from("practice_exams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return <QuestionariosClient userId={user.id} exams={exams} />
}
