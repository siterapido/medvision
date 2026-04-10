import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, Sparkles } from "lucide-react"

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
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Meu Perfil</h1>
        <p className="text-slate-400 mt-2">
          Gerencie suas informações e visualize detalhes da sua conta.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
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

        {/* Seção de Assinatura - Design System Compliant */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-none relative overflow-hidden">
            {/* Subtle glow effect for premium feel */}
            {isPremium && (
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            )}

            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-50">
                    <span className="p-2 rounded-lg bg-cyan-950/30 text-cyan-400 border border-cyan-900/50">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    Assinatura
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Gerencie seu plano
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">

              {/* Status Card */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Plano Atual</span>
                  <Badge
                    variant={isPremium ? "default" : "secondary"}
                    className={isPremium ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] border-0" : "bg-slate-800 text-slate-300"}
                  >
                    {profile.plan_type === "annual" ? "Premium Anual" :
                      profile.plan_type === "monthly" ? "Premium Mensal" : "Gratuito"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${profile.subscription_status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-slate-600'}`} />
                    <span className="text-sm font-medium text-slate-200">{statusLabel}</span>
                  </div>
                </div>

                {profile.trial_ends_at && (
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fim do Teste
                    </span>
                    <span className="text-sm font-medium text-slate-200">{trialEnds}</span>
                  </div>
                )}
              </div>

              {/* Action Area */}
              {!isPremium ? (
                <div className="rounded-xl overflow-hidden relative group cursor-pointer border border-cyan-900/30 bg-cyan-950/10 hover:border-cyan-700/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-4 text-center space-y-2 relative">
                    <div className="flex justify-center mb-2">
                      <Sparkles className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="font-semibold text-cyan-400">Faça o Upgrade Agora</p>
                    <p className="text-xs text-slate-400">Desbloqueie todo o potencial da IA na Odontologia</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-center">
                    <p className="text-xs font-medium text-emerald-400">Ilimitado</p>
                    <p className="text-[10px] text-slate-500">Consultas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/30 text-center">
                    <p className="text-xs font-medium text-cyan-400">Premium</p>
                    <p className="text-[10px] text-slate-500">Suporte</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
