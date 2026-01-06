import { ChatShell } from "@/components/chat/chat-shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("id", user.id)
    .single()

  const plan = profile?.plan_type || "free"

  return <ChatShell plan={plan} />
}
