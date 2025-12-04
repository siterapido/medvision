import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"
import { redirect } from "next/navigation"
import { NotificationsWorkspace } from "@/components/admin/notifications/notifications-workspace"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Notificações | Admin",
  description: "Gerencie notificações via WhatsApp",
}

async function NotificationsContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  
  if (resolveUserRole(profile?.role, user) !== "admin") {
    redirect("/dashboard")
  }

  // 1. Fetch Users (limit to recent/active for dropdown)
  // For a real app with many users, this should be a search API, but for now we fetch recent 100.
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, email, whatsapp")
    .order("created_at", { ascending: false })
    .limit(100)

  // 2. Fetch Logs
  const { data: logs } = await supabase
    .from("notification_logs")
    .select(`
      *,
      profiles (name, email, whatsapp),
      notification_templates (name)
    `)
    .order("sent_at", { ascending: false })
    .limit(50)

  // 3. Fetch Templates
  const { data: templates } = await supabase
    .from("notification_templates")
    .select("*")
    .order("name")

  return (
    <NotificationsWorkspace
      initialUsers={users || []}
      initialLogs={logs || []}
      initialTemplates={templates || []}
    />
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Carregando notificações...</p>
      </div>
    </div>
  )
}

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Notificações WhatsApp</h1>
          <p className="text-slate-400">
            Gerencie envios manuais e automáticos via Z-API
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <NotificationsContent />
        </Suspense>
      </div>
    </div>
  )
}











