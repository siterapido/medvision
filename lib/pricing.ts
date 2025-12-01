import { CAKTO_MONTHLY_PLAN_ID, CAKTO_ANNUAL_PLAN_ID } from "@/lib/cakto"

export type Plan = {
  id: "monthly" | "annual"
  name: string
  price: string
  period: string
  description?: string
  features: string[]
  cta: string
  popular: boolean
  caktoId: string
}

export const plans: Plan[] = [
  {
    id: "monthly",
    name: "Plano Mensal",
    price: "R$ 30",
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
    name: "Plano Anual",
    price: "R$ 240",
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
]
