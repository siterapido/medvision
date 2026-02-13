import { CAKTO_BASIC_MONTHLY_PLAN_ID, CAKTO_PRO_MONTHLY_PLAN_ID, CAKTO_CERTIFICATE_ID } from "@/lib/cakto"

export type Plan = {
  id: "basic" | "pro" | "certificate"
  name: string
  price: string
  originalPrice?: string
  installmentPrice?: string // Preço em 12x
  period: string
  description?: string
  features: string[]
  cta: string
  popular: boolean
  caktoId: string
  lifetime?: boolean
  upsell?: {
    title: string
    price: string
    originalPrice?: string
  }
}

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Plano Basico",
    price: "R$ 39,90",
    period: "/mes",
    popular: true,
    caktoId: CAKTO_BASIC_MONTHLY_PLAN_ID,
    features: [
      "Consultor 24/7 no WhatsApp - sem limite de perguntas",
      "Respostas fundamentadas em literatura cientifica",
      "Prescricoes com dosagens corretas e protocolos atualizados",
      "Ajuda em provas, estagios e casos clinicos complexos",
      "Live exclusiva toda quarta-feira com Q&A",
    ],
    cta: "Assinar Plano Basico",
  },
  {
    id: "pro",
    name: "Plano Pro",
    price: "R$ 59,90",
    period: "/mes",
    popular: false,
    caktoId: CAKTO_PRO_MONTHLY_PLAN_ID,
    features: [
      "Tudo do Plano Basico",
      "Odonto Vision: Analise visual avancada",
      "Relatorios de evolucao de casos",
      "Acesso a biblioteca premium de casos clinicos",
      "Suporte prioritario",
      "Ebook exclusivo: Como Validar Seu Diploma nos EUA",
      "Certificado mensal de participacao nas lives",
      "Acesso prioritario a novas funcionalidades",
    ],
    cta: "Assinar Plano Pro",
  },
  {
    id: "certificate",
    name: "Certificado - Consultorio do Futuro",
    price: "R$ 297",
    period: "vitalicio",
    popular: false,
    lifetime: true,
    caktoId: CAKTO_CERTIFICATE_ID,
    features: [
      "Certificado oficial de conclusao",
      "Acesso vitalicio ao conteudo",
      "Material complementar exclusivo",
    ],
    cta: "Adquirir Certificado",
  },
]
