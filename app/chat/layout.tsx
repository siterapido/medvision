import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/login")
    }

    return (
      <div className="flex h-screen bg-background">
        <ChatSidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in chat layout:", error)
    redirect("/login")
  }
}
