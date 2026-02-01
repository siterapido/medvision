// Funnel stage definitions (non-server file)

// Lead stages (prospecção)
export const LEAD_STAGES = [
  { id: "novo_lead", label: "Novo Lead", icon: "📥", color: "bg-slate-500" },
  { id: "contato_realizado", label: "Contato Realizado", icon: "📞", color: "bg-blue-500" },
  { id: "interessado", label: "Interessado", icon: "🎯", color: "bg-purple-500" },
  { id: "aguardando_cadastro", label: "Aguardando Cadastro", icon: "⏳", color: "bg-amber-500" },
  { id: "convertido", label: "Convertido", icon: "✅", color: "bg-green-500" },
  { id: "descartado", label: "Descartado", icon: "❌", color: "bg-red-500" },
] as const

// Profile stages (conversão trial)
export const PROFILE_STAGES = [
  { id: "cadastro", label: "Cadastro", icon: "📥", color: "bg-slate-500" },
  { id: "primeira_consulta", label: "Primeira Consulta", icon: "🧪", color: "bg-blue-500" },
  { id: "usou_vision", label: "Usou Vision", icon: "🧠", color: "bg-purple-500" },
  { id: "uso_recorrente", label: "Uso Recorrente", icon: "🔄", color: "bg-indigo-500" },
  { id: "barreira_plano", label: "Barreira do Plano", icon: "🚧", color: "bg-amber-500" },
  { id: "convertido", label: "Convertido", icon: "💳", color: "bg-green-500" },
  { id: "risco_churn", label: "Risco de Churn", icon: "👻", color: "bg-orange-500" },
  { id: "perdido", label: "Perdido", icon: "❌", color: "bg-red-500" },
] as const

export type LeadStageId = typeof LEAD_STAGES[number]["id"]
export type ProfileStageId = typeof PROFILE_STAGES[number]["id"]

export type FunnelMetrics = {
  prospecting: {
    total: number
    byStage: Record<LeadStageId, number>
    conversionRate: number
  }
  trial: {
    total: number
    byStage: Record<ProfileStageId, number>
    conversionRate: number
  }
  overall: {
    totalLeads: number
    totalTrials: number
    totalPaid: number
    leadToTrialRate: number
    trialToPaidRate: number
    leadToPaidRate: number
  }
}
