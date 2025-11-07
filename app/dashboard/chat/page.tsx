"use client"

import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage() {
  return (
    <div className="-mx-4 -my-6 flex h-full w-[calc(100%+2rem)] flex-1 flex-col md:-mx-8 md:w-[calc(100%+4rem)]">
      <ChatInterface />
    </div>
  )
}
