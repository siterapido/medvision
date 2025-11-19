import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { LiveManagement } from "./live-management"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Gestão de Lives | Admin",
  description: "Gerenciar lives da plataforma",
}

async function LivesContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white">Acesso necessário</p>
          <p className="text-sm text-slate-300">Faça login novamente para continuar gerenciando lives.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  const adminName = profile?.full_name || user.email || "Administrador"

  let { data: lives, error } = await supabase
    .from("lives")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar lives:", error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Erro ao carregar lives</p>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return <LiveManagement lives={lives || []} adminName={adminName} />
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando lives...</p>
      </div>
    </div>
  )
}

export default function AdminLivesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Cadastrar Lives</h1>
          <p className="text-slate-400">Gerencie todas as lives da plataforma</p>
        </div>
        <Suspense fallback={<LoadingState />}>
          <LivesContent />
        </Suspense>
      </div>
    </div>
  )
}