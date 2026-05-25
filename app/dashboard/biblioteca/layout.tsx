import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"

export default async function BibliotecaLayout({ children }: { children: React.ReactNode }) {
    const user = await getUser()
    if (user) {
        const supabase = await createClient()
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan_type")
            .eq("id", user.id)
            .single()

        if (!profile?.plan_type || profile.plan_type === "free") {
            redirect("/dashboard")
        }
    }

    return <>{children}</>
}
