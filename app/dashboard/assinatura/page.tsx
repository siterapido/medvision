import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Check, Clock } from "lucide-react"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { getRemainingTrialDays, isTrialActive } from "@/lib/trial"
import { plans } from "@/lib/pricing"

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Buscar assinatura e perfil em paralelo
  const [subscriptionResult, profileResult] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).single()
  ])

  const subscription = subscriptionResult.data
  const profile = profileResult.data

  let currentPlan = "Free"
  let isActive = false
  let isTrial = false
  let trialDaysRemaining = 0

  if (subscription?.status === "active") {
    currentPlan = subscription.plan_type === "monthly" 
      ? "Mensal" 
      : subscription.plan_type === "annual" 
        ? "Anual" 
        : subscription.plan_type || "Premium"
    isActive = true
  } else if (profile?.plan_type && profile.plan_type !== "free") {
    // Fallback para verificar no profile se não achar subscription
    currentPlan = profile.plan_type === "monthly" 
      ? "Mensal" 
      : profile.plan_type === "annual" 
        ? "Anual" 
        : "Premium"
    isActive = true
  } else if (profile?.trial_ends_at && isTrialActive(profile.trial_ends_at)) {
    isTrial = true
    isActive = true
    currentPlan = "Trial Gratuito"
    trialDaysRemaining = getRemainingTrialDays(profile.trial_ends_at)
  }

  return (
    <DashboardScrollArea>
      <div className="space-y-6 pb-12">
        {/* Status do plano atual */}
        {isActive && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">
                Plano Atual: <span className="text-primary font-bold">{currentPlan}</span>
              </h2>
              {isTrial ? (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    {trialDaysRemaining === 0 
                      ? "Seu teste grátis acaba hoje!" 
                      : `Você tem ${trialDaysRemaining} dias restantes de acesso gratuito.`}
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Sua assinatura está ativa e você tem acesso a todos os recursos.</p>
              )}
            </div>
            
            <Badge 
              className={isTrial 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 text-sm h-fit w-fit" 
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-sm h-fit w-fit"
              } 
              variant="outline"
            >
              {isTrial ? "Em Período de Teste" : "Ativo"}
            </Badge>
          </div>
        )}

        {/* Header se não tiver plano ativo nem trial */}
        {!isActive && (
           <div className="text-center md:text-left mb-8">
             <h2 className="text-2xl font-bold text-white mb-2">Escolha seu plano</h2>
             <p className="text-slate-400">Desbloqueie todo o potencial do Odonto GPT hoje mesmo.</p>
           </div>
        )}

        {/* Grid de planos */}
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan =
              (plan.id === "monthly" && currentPlan === "Mensal") ||
              (plan.id === "annual" && currentPlan === "Anual")
            
            const checkoutUrl = `https://pay.cakto.com.br/${plan.caktoId}`
            
            return (
              <Card
                key={plan.id}
                className={
                  plan.popular
                    ? "relative overflow-hidden p-8 md:p-10 transition-all border-2 border-primary shadow-2xl md:scale-[1.04] bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
                    : "relative overflow-hidden border-2 border-border transition-all bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
                }
              >
                {plan.popular && (
                  <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                    <span className="bg-accent text-accent-foreground px-16 py-1 text-xs font-semibold shadow-md">Oferta Especial</span>
                  </div>
                )}
                <CardContent className={plan.popular ? "space-y-4 p-0" : "px-5 pt-5 pb-3 space-y-3"}>
                  <div className={plan.popular ? "px-8 md:px-10" : undefined}>
                    {plan.popular && (
                      <div className="flex justify-center mb-3">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">ESCOLHA INTELIGENTE</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-center md:text-left">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1 justify-center md:justify-start">
                      <span className="text-4xl font-extrabold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full" size="lg" variant="secondary">
                      Seu Plano Atual
                    </Button>
                  ) : (
                    <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button
                        className="w-full"
                        size="lg"
                        variant={plan.popular ? "cta" : "default"}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  )}
                  
                  {isTrial && !isCurrentPlan && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Fazer upgrade encerra seu período de teste e inicia a assinatura.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardScrollArea>
  )
}
