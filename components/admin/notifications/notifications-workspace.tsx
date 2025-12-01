"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MessageSquare, History, Settings, TestTube, RefreshCcw, Activity, Inbox } from "lucide-react"
import { ManualSender } from "./manual-sender"
import { NotificationHistory } from "./notification-history"
import { TemplatesManager } from "./templates-manager"
import { ZApiTestPanel } from "./zapi-test-panel"
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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"manual" | "history" | "templates" | "test">("manual")
  const [isRefreshing, startRefresh] = useTransition()

  const statusCounts = useMemo(() => {
    return initialLogs.reduce(
      (acc, log) => {
        acc.total += 1
        if (log.status === "sent") acc.sent += 1
        if (log.status === "failed") acc.failed += 1
        if (log.status === "pending") acc.pending += 1
        return acc
      },
      { total: 0, sent: 0, failed: 0, pending: 0 }
    )
  }, [initialLogs])

  const channelCounts = useMemo(() => {
    return initialLogs.reduce(
      (acc, log) => {
        if (log.channel === "email") acc.email += 1
        if (log.channel === "whatsapp") acc.whatsapp += 1
        return acc
      },
      { whatsapp: 0, email: 0 }
    )
  }, [initialLogs])

  const activeTemplates = useMemo(() => initialTemplates.filter((tpl) => tpl.active).length, [initialTemplates])

  const successRate = statusCounts.total > 0 ? Math.round((statusCounts.sent / statusCounts.total) * 100) : null

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Envios</p>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                <Activity className="h-3.5 w-3.5 mr-1" /> {statusCounts.total}
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-white">{statusCounts.sent}</p>
            <p className="text-xs text-slate-400">
              {successRate !== null ? `${successRate}% de sucesso` : "Nenhum envio ainda"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Pendências</p>
              <Badge variant="outline" className="border-amber-500/20 text-amber-300 bg-amber-500/10">
                {statusCounts.pending}
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-white">{statusCounts.failed}</p>
            <p className="text-xs text-slate-400">Falhas recentes e mensagens aguardando reenvio</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Templates ativos</p>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-300 bg-emerald-500/10">
                {activeTemplates}
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-white">{initialTemplates.length}</p>
            <p className="text-xs text-slate-400">Padrões disponíveis para disparos</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Canais</p>
              <Badge variant="outline" className="border-slate-700 text-slate-200 bg-slate-800/80">
                <Inbox className="h-3.5 w-3.5 mr-1" /> Mix
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-white">{channelCounts.whatsapp}</p>
            <p className="text-xs text-slate-400">
              WhatsApp · {channelCounts.whatsapp} | Email · {channelCounts.email}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={activeTab === "manual" ? "default" : "secondary"} onClick={() => setActiveTab("manual")} className={cn("bg-emerald-600 text-white hover:bg-emerald-700", activeTab !== "manual" && "bg-slate-800 text-slate-200 hover:bg-slate-700") }>
            <MessageSquare className="mr-2 h-4 w-4" /> Novo envio
          </Button>
          <Button size="sm" variant={activeTab === "history" ? "default" : "ghost"} onClick={() => setActiveTab("history")} className={activeTab === "history" ? "bg-slate-800 text-white" : "text-slate-200 hover:text-white"}>
            <History className="mr-2 h-4 w-4" /> Histórico
          </Button>
          <Button size="sm" variant={activeTab === "templates" ? "default" : "ghost"} onClick={() => setActiveTab("templates")} className={activeTab === "templates" ? "bg-slate-800 text-white" : "text-slate-200 hover:text-white"}>
            <Settings className="mr-2 h-4 w-4" /> Templates
          </Button>
          <Button size="sm" variant={activeTab === "test" ? "default" : "ghost"} onClick={() => setActiveTab("test")} className={activeTab === "test" ? "bg-slate-800 text-white" : "text-slate-200 hover:text-white"}>
            <TestTube className="mr-2 h-4 w-4" /> Teste Z-API
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-300">
            {statusCounts.total} envios recentes
          </Badge>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="border-slate-700 text-slate-200 hover:bg-slate-800">
            <RefreshCcw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "manual" && <ManualSender initialUsers={initialUsers} />}
        {activeTab === "history" && <NotificationHistory logs={initialLogs} />}
        {activeTab === "templates" && <TemplatesManager initialTemplates={initialTemplates} />}
        {activeTab === "test" && <ZApiTestPanel />}
      </div>
    </div>
  )
}

