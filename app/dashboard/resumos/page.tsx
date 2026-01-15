
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ResumosClient } from "@/components/dashboard/resumos-client"

export default async function ResumosPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch summaries
  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <ResumosClient userId={user.id} summaries={summaries} />
}
