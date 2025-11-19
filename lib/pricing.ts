export type Plan = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular: boolean
}

export const plans: Plan[] = [
  {
    name: "Mensal",
    price: "R$ 97",
    period: "/mês",
    description: "Perfeito para começar sua jornada",
    features: [
      "Acesso ao Odonto GPT",
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
