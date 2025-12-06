import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { resolveUserRole } from "@/lib/auth/roles"
import { UserProfileView } from "@/components/admin/user-profile-view"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Perfil do Usuário | Admin",
  description: "Visualizar e gerenciar perfil do usuário",
}

async function UserProfileContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    redirect("/login")
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminUser.id)
    .single()

  if (resolveUserRole(adminProfile?.role, adminUser) !== "admin") {
    redirect("/dashboard")
  }

  // Buscar dados completos do usuário
  const [userProfileResult, purchasesResult, paymentHistoryResult, subscriptionResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("course_purchases")
        .select(
          `
          *,
          course:courses (
            id,
            title,
            image_url
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    ])

  if (userProfileResult.error || !userProfileResult.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-semibold">Usuário não encontrado</p>
          <p className="text-sm text-slate-400">
            O usuário com ID {userId} não foi encontrado.
          </p>
        </div>
      </div>
    )
  }

  const userProfile = userProfileResult.data
  const purchases = purchasesResult.data || []
  const paymentHistory = paymentHistoryResult.data || []
  const subscription = subscriptionResult.data

  return (
    <UserProfileView
      user={userProfile}
      purchases={purchases}
      paymentHistory={paymentHistory}
      subscription={subscription}
    />
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando perfil do usuário...</p>
      </div>
    </div>
  )
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const userId = resolvedParams.id

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Perfil do Usuário</h1>
        <p className="text-slate-400">Visualize e gerencie dados, compras e assinaturas</p>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingState />}>
        <UserProfileContent userId={userId} />
      </Suspense>
    </div>
  )
}









