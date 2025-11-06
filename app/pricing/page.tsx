import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const plans = [
  {
    name: "Mensal",
    price: "R$ 97",
    period: "/mês",
    description: "Perfeito para começar sua jornada",
    features: [
      "Acesso ao Chat de IA",
      "Todos os cursos disponíveis",
      "Certificados de conclusão",
      "Suporte por email",
      "Atualizações mensais",
    ],
    cta: "Assinar Plano Mensal",
    popular: false,
  },
  {
    name: "Anual",
    price: "R$ 970",
    period: "/ano",
    description: "Melhor custo-benefício com bônus exclusivos",
    features: [
      "Tudo do plano mensal",
      "2 meses grátis (economize R$ 194)",
      "Acesso prioritário a novos cursos",
      "Suporte prioritário",
      "Sessões de mentoria exclusivas",
      "Material complementar em PDF",
      "Certificados premium",
    ],
    cta: "Assinar Plano Anual",
    popular: true,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-session-pricing">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Escolha seu Plano</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Invista no seu desenvolvimento profissional com acesso completo à plataforma Odonto GPT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 ${
                plan.popular ? "border-2 border-primary shadow-xl scale-105" : "border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                size="lg"
                variant={plan.popular ? "cta" : "secondary"}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Pagamento seguro via Stripe ou Asaas</p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Pagamento Seguro
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Garantia de 7 dias
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Cartão ou Boleto
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
