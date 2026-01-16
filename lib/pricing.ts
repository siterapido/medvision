import { CAKTO_MONTHLY_PLAN_ID, CAKTO_ANNUAL_PLAN_ID } from "@/lib/cakto"

export type Plan = {
  id: "monthly" | "annual" | "pro"
  name: string
  price: string
  originalPrice?: string
  period: string
  description?: string
  features: string[]
  cta: string
  popular: boolean
  caktoId: string
  upsell?: {
    title: string
    price: string
    originalPrice?: string
  }
}

export const plans: Plan[] = [
  {
    id: "monthly",
    name: "Mensal Básico",
    price: "R$ 39,80",
    originalPrice: "R$ 59,90",
    period: "/mês",
    popular: false,
    caktoId: CAKTO_MONTHLY_PLAN_ID,
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
    name: "Anual Básico",
    price: "R$ 387",
    originalPrice: "R$ 597",
    period: "/ano",
    popular: true,
    caktoId: CAKTO_ANNUAL_PLAN_ID,
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
  {
    id: "pro",
    name: "Odonto Vision Pro",
    price: "R$ 597",
    originalPrice: "R$ 797",
    period: "/ano",
    popular: false,
    caktoId: CAKTO_ANNUAL_PLAN_ID,
    features: [
      "Tudo do Anual Básico",
      "👁️ Odonto Vision: Análise visual avançada",
      "📊 Relatórios de evolução de casos",
      "🎓 Acesso a biblioteca premium de casos clínicos",
      "🚀 Suporte prioritário",
      "🎁 Ebook exclusivo: Como Validar Seu Diploma nos EUA",
      "🎁 Certificado mensal de participação nas lives",
      "🎁 Acesso prioritário a novas funcionalidades",
    ],
    cta: "Assinar Odonto Vision Pro",
    upsell: {
      title: "+ Curso de Farmacologia",
      price: "R$ 367",
    },
  },
]
