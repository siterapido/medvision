import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"
import { ChatHistoryClient } from "./client"

export default async function ChatHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const role = resolveUserRole(undefined, user)

  return <ChatHistoryClient userId={user.id} />
}
