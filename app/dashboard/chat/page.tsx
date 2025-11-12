"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

export default function ChatPage() {
  return (
    <DashboardScrollArea className="px-0 py-0 !pb-0 scrollbar-hidden">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        <ChatInterface />
      </div>
    </DashboardScrollArea>
  )
}
