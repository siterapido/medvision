import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { UsersManager } from "@/components/admin/users-manager"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Gerenciamento de Usuários | Admin",
  description: "Gerenciar usuários da plataforma",
}

async function UsersContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white">Acesso necessário</p>
          <p className="text-sm text-slate-300">
            Faça login novamente para continuar gerenciando usuários.
          </p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle()

  // Buscar todos os usuários com informações de assinatura e trial
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar usuários:", error)

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-3">
            <p className="text-red-400 text-lg font-semibold">Erro ao carregar usuários</p>
            <p className="text-sm text-slate-400">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UsersManager
      users={users || []}
      adminName={profile?.name || user.email || "Administrador"}
    />
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando usuários...</p>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
        <p className="text-sm sm:text-base text-slate-400">
          Visualize, gerencie e edite usuários da plataforma
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingState />}>
        <UsersContent />
      </Suspense>
    </div>
  )
}

