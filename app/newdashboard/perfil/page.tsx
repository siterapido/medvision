import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Meu Perfil | MedVision",
  description: "Gerencie suas informações pessoais e assinatura.",
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <div>Erro ao carregar perfil.</div>
  }

  // Format subscription dates if available
  const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString("pt-BR") : null
  const isPremium = profile.plan_type !== "free"
  const statusMap: Record<string, string> = {
    active: "Ativo",
    canceled: "Cancelado",
    past_due: "Pendente",
    trialing: "Período de Teste",
    free: "Gratuito"
  }
  
  const statusLabel = statusMap[profile.subscription_status || "free"] || profile.subscription_status

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações e visualize detalhes da sua conta.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <ProfileForm 
            initialData={{
              name: profile.name || profile.full_name,
              email: user.email,
              telefone: profile.telefone,
              cro: profile.cro,
              especialidade: profile.especialidade
            }} 
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinatura
              </CardTitle>
              <CardDescription>Status atual do seu plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Plano Atual</span>
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {profile.plan_type === "annual" ? "Anual" : 
                   profile.plan_type === "monthly" ? "Mensal" : "Gratuito"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Status</span>
                <span className="text-sm text-muted-foreground">{statusLabel}</span>
              </div>

              {profile.trial_ends_at && (
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fim do Teste
                  </span>
                  <span className="text-sm text-muted-foreground">{trialEnds}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
