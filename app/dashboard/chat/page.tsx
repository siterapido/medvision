import { ChatClient } from "@/components/dashboard/chat-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Chat IA | Odonto Suite",
  description: "Converse com nosso assistente de IA especializado em odontologia",
}

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  return <ChatClient userId={user.id} />
}
