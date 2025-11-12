import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Check, Sparkles, Crown } from "lucide-react"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

const planOptions = [
  {
    id: "monthly",
    name: "Plano Mensal",
    price: "R$ 30",
    cadence: "/mês",
    highlight: false,
    features: [
      "Consultor 24/7 no WhatsApp - sem limite de perguntas",
      "Respostas fundamentadas em literatura científica",
      "Prescrições com dosagens corretas e protocolos atualizados",
      "Ajuda em provas, estágios e casos clínicos complexos",
      "Live exclusiva toda quarta-feira com Q&A",
    ],
    cta: "Assinar Plano Mensal",
  },
  {
    id: "annual",
    name: "Plano Anual",
    price: "R$ 240",
    cadence: "/ano",
    highlight: true,
    features: [
      "Consultor 24/7 no WhatsApp - sem limite de perguntas",
      "Respostas fundamentadas em literatura científica",
      "Prescrições com dosagens corretas e protocolos atualizados",
      "Ajuda em provas, estágios e casos clínicos complexos",
      "Live exclusiva toda quarta-feira com Q&A",
      "🎁 Ebook exclusivo: Como Validar Seu Diploma nos EUA",
      "🎁 Certificado mensal de participação nas lives",
      "🎁 Acesso prioritário a novas funcionalidades",
    ],
    cta: "Assinar Plano Anual",
  },
]

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  const currentPlan =
    subscription?.plan === "monthly"
      ? "Mensal"
      : subscription?.plan === "annual"
        ? "Anual"
        : "Free"

  const isActive = subscription?.status === "active"

  return (
    <DashboardScrollArea>
      <div className="space-y-6 pb-12">
        {/* Status do plano atual - minimalista */}
        {isActive && (
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Plano atual: <span className="font-semibold text-white">{currentPlan}</span></span>
            <Badge className="border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#7dd7e9]" variant="outline">
              Ativo
            </Badge>
          </div>
        )}

        {/* Grid de planos */}
        <div className="grid gap-6 md:grid-cols-2">
          {planOptions.map((plan) => {
            const isCurrentPlan =
              (plan.id === "monthly" && currentPlan === "Mensal") ||
              (plan.id === "annual" && currentPlan === "Anual")

            return (
              <Card
                key={plan.id}
                className={
                  "relative overflow-hidden border-2 transition-all" +
                  (plan.highlight
                    ? " border-primary"
                    : " border-border")
                }
              >
                {plan.highlight && (
                  <div className="absolute right-4 top-4 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-3 py-1 text-xs font-medium text-[#7dd7e9]">
                    <Crown className="mr-1 inline h-3.5 w-3.5" /> Mais indicado
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.cadence}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    disabled={isCurrentPlan}
                    className="w-full"
                    size="lg"
                    variant={plan.highlight ? "cta" : "default"}
                  >
                    {isCurrentPlan ? "Plano atual" : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardScrollArea>
  )
}
