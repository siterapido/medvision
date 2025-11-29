"use client"

import { useState } from "react"
import { MessageSquare, History, Settings } from "lucide-react"
import { ManualSender } from "./manual-sender"
import { NotificationHistory } from "./notification-history"
import { TemplatesManager } from "./templates-manager"
import type { NotificationLog, NotificationTemplate } from "./types"

interface Profile {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
}

interface NotificationsWorkspaceProps {
  initialUsers: Profile[]
  initialLogs: NotificationLog[]
  initialTemplates: NotificationTemplate[]
}

export function NotificationsWorkspace({
  initialUsers,
  initialLogs,
  initialTemplates,
}: NotificationsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "history" | "templates">("manual")

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md ${
            activeTab === "manual"
              ? "bg-emerald-500/10 text-emerald-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Envio Manual
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md ${
            activeTab === "history"
              ? "bg-emerald-500/10 text-emerald-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Histórico
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md ${
            activeTab === "templates"
              ? "bg-emerald-500/10 text-emerald-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" />
          Templates
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "manual" && <ManualSender initialUsers={initialUsers} />}
        {activeTab === "history" && <NotificationHistory logs={initialLogs} />}
        {activeTab === "templates" && <TemplatesManager initialTemplates={initialTemplates} />}
      </div>
    </div>
  )
}

