import { ProfileForm } from "@/components/profile/profile-form"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function PerfilPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user subscription
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuário"

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(displayName)

  const planType =
    subscription?.plan === "monthly"
      ? "Plano Mensal Pro"
      : subscription?.plan === "annual"
        ? "Plano Anual Pro"
        : "Plano Free"

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : "Recente"

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {initials}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">{displayName}</h3>
            <p className="text-sm text-muted-foreground mb-2">{profile?.email || user.email}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">{planType}</span>
              <span className="text-xs text-muted-foreground">Membro desde {memberSince}</span>
            </div>
          </div>
        </div>

        <ProfileForm
          initialData={{
            full_name: profile?.full_name || "",
            email: profile?.email || user.email || "",
            profession: profile?.profession || "",
            cro: profile?.cro || "",
            company: profile?.company || "",
          }}
        />
      </Card>
    </div>
  )
}
