"use client"

import { ChatInterface } from "./chat-interface"

type ChatShellProps = {
  plan?: string
}

export function ChatShell({ plan = "free" }: ChatShellProps) {
  return (
    <div className="flex h-full w-full">
      {/* Chat Interface */}
      <div className="flex-1 min-w-0">
        <ChatInterface plan={plan} />
      </div>
    </div>
  )
}

