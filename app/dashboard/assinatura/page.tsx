import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Check, Sparkles, Crown } from "lucide-react"

const planOptions = [
  {
    id: "monthly",
    name: "Plano Mensal",
    description: "Flexibilidade para usar IA clínica quando precisar.",
    price: "R$ 30",
    cadence: "/mês",
    badge: "Entrada rápida",
    highlight: false,
    savings: "Cancelamento instantâneo",
    features: [
      "Chat clínico com prompts ilimitados",
      "Cursos e coleções sob demanda",
      "Checklists e certificados essenciais",
    ],
    cta: "Assinar Plano Mensal",
  },
  {
    id: "annual",
    name: "Plano Anual",
    description: "Melhor custo-benefício e prioridade nos lançamentos.",
    price: "R$ 240",
    cadence: "/ano",
    badge: "Mais indicado",
    highlight: true,
    savings: "Economize 33% + bônus",
    features: [
      "Tudo do plano mensal",
      "Mentorias e materiais exclusivos",
      "Suporte prioritário em 4h",
    ],
    cta: "Assinar Plano Anual",
  },
]

const sharedPillars = [
  {
    title: "Laboratório IA Clínico",
    description: "Modelos proprietários calibrados para as principais especialidades.",
  },
  {
    title: "Coleções imersivas",
    description: "Trilhas tipo Netflix com badges e atualizações semanais.",
  },
  {
    title: "Especialistas ativos",
    description: "Instrutores convidados com mais de 1.000 casos reais.",
  },
]

const freeHighlights = [
  "Acesso limitado ao Chat de IA",
  "Cursos introdutórios selecionados",
]

const premiumHighlights = [
  "Chat clínico ilimitado com históricos salvos",
  "Todas as coleções e cursos premium",
  "Certificados e suporte prioritário",
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
  const accessHighlights = currentPlan === "Free" ? freeHighlights : premiumHighlights

  return (
    <div className="space-y-8 pb-12">
      <Card className="relative overflow-hidden rounded-3xl border-[#24324F] bg-[#0F192F] text-white shadow-[0_25px_80px_rgba(5,12,28,0.65)]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2399B4]/40 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-12 translate-y-16 rounded-full bg-[#06b6d4]/30 blur-[90px]" />
        </div>
        <CardHeader className="relative z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-white/70">
                <Sparkles className="h-4 w-4 text-[#06b6d4]" />
                <span>Central de Assinatura</span>
              </div>
              <CardTitle className="mt-3 text-3xl font-semibold">Seu status no Odonto GPT</CardTitle>
              <CardDescription className="mt-2 text-base text-slate-200">
                Você está no plano <span className="font-semibold text-white">{currentPlan}</span>
              </CardDescription>
            </div>
            <Badge
              className={
                "border-transparent bg-[#06b6d4]/15 px-4 py-1 text-sm font-medium text-[#7dd7e9]" +
                (isActive ? "" : " opacity-60")
              }
              variant="outline"
            >
              {isActive ? "Plano ativo" : "Plano inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm text-slate-200/90">
                Interface clínica enxuta para mostrar rapidamente seu status e os principais benefícios.
              </p>
              <div className="grid gap-3">
                {accessHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-100">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#06b6d4]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
              <p className="font-medium text-white">Troca de plano simples</p>
              <p className="mt-2 text-slate-300">
                Downgrade mantém acesso até o fim do ciclo. Upgrade libera os bônus na mesma hora.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden rounded-3xl border-[#24324F] bg-[#0B1627] text-white shadow-[0_20px_60px_rgba(3,10,24,0.7)]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#2399B4]/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#06b6d4]/15 blur-[120px]" />
        </div>
        <CardHeader className="relative z-10 space-y-3">
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">Planos disponíveis</div>
          <CardTitle className="text-3xl font-semibold text-[#E6EDF7]">
            Escolha o nível de profundidade clínica ideal
          </CardTitle>
          <CardDescription className="text-base text-slate-300">
            Cartões escuros, gradientes teal e badges diretas para ajudar você a escolher em segundos.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {sharedPillars.map((pillar) => (
                  <div key={pillar.title} className="rounded-2xl border border-white/5 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">{pillar.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{pillar.description}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[#2399B4]/40 bg-[#131F38]/80 p-6">
                <div className="flex items-center gap-2 text-[#06b6d4]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-[0.2em]">Garantia clínica</span>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">7 dias para testar com a sua equipe</p>
                <p className="mt-2 text-sm text-slate-300">
                  Teste com sua equipe por 7 dias. Não gostou? Cancelou, reembolsamos 100%.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {planOptions.map((plan) => {
                const isCurrentPlan =
                  (plan.id === "monthly" && currentPlan === "Mensal") ||
                  (plan.id === "annual" && currentPlan === "Anual")

                return (
                  <div
                    key={plan.id}
                    className={
                      "relative overflow-hidden rounded-2xl border p-6" +
                      (plan.highlight
                        ? " border-[#2399B4]/60 bg-gradient-to-br from-[#0F192F] via-[#131D37] to-[#1A2847] shadow-[0_15px_45px_rgba(6,182,212,0.4)]"
                        : " border-white/10 bg-gradient-to-br from-[#131D37] via-[#0F192F] to-[#0B1627]")
                    }
                  >
                    {plan.highlight && (
                      <div className="absolute right-4 top-4 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-3 py-1 text-xs font-medium text-[#7dd7e9]">
                        <Crown className="mr-1 inline h-3.5 w-3.5" /> Mais indicado
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/60">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
                          {plan.badge}
                        </span>
                        <span className="text-[11px] font-semibold text-[#7dd7e9]">{plan.savings}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                        <p className="mt-1 text-sm text-slate-300">{plan.description}</p>
                        <div className="mt-5 flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          <span className="text-sm text-slate-300">{plan.cadence}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-200">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#06b6d4]" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        disabled={isCurrentPlan}
                        className={
                          "mt-6 w-full border border-transparent text-sm font-semibold" +
                          (plan.highlight
                            ? " bg-[#06b6d4] text-[#031520] hover:bg-[#05a0ba]"
                            : " bg-white/10 text-white hover:bg-white/20") +
                          (isCurrentPlan ? " opacity-70" : "")
                        }
                      >
                        {isCurrentPlan ? "Plano atual" : plan.cta}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
