"use client"

import { useMemo, useState } from "react"
import { Clock3, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { LeadCard } from "./lead-card"

type PipelineLead = {
  id: string
  name?: string | null
  email?: string | null
  whatsapp?: string | null
  profession?: string | null
  company?: string | null
  institution?: string | null
  plan_type?: string | null
  subscription_status?: string | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_used?: boolean | null
  created_at?: string | null
  pipeline_stage?: string | null
}

type PipelineStage =
  | "novo_lead"
  | "trial_ativo"
  | "urgente"
  | "contato_realizado"
  | "proposta_enviada"
  | "convertido"
  | "perdido"

type StageConfig = {
  id: PipelineStage
  title: string
}

const STAGES: StageConfig[] = [
  { id: "novo_lead", title: "Novo Lead" },
  { id: "trial_ativo", title: "Trial Ativo" },
  { id: "urgente", title: "Urgente" },
  { id: "contato_realizado", title: "Contato Realizado" },
  { id: "proposta_enviada", title: "Proposta Enviada" },
  { id: "convertido", title: "Convertido" },
  { id: "perdido", title: "Perdido" },
]

type PipelineLeadWithStage = PipelineLead & { resolvedStage: PipelineStage }

/**
 * Resolve a etapa do pipeline para um lead
 * Se pipeline_stage estiver definido, usa ele
 * Caso contrário, resolve automaticamente baseado no status do trial
 */
function resolvePipelineStage(lead: PipelineLead): PipelineStage {
  // Se tem etapa manual definida, usa ela (exceto se convertido)
  if (lead.pipeline_stage) {
    const manualStage = lead.pipeline_stage as PipelineStage
    // Se converter para pago, sempre mostra como convertido
    const hasPaidPlan = !!lead.plan_type && lead.plan_type !== "free"
    if (hasPaidPlan && manualStage !== "convertido") {
      return "convertido"
    }
    return manualStage
  }

  // Resolução automática baseada no status do trial
  const now = new Date()
  const endsAt = lead.trial_ends_at ? new Date(lead.trial_ends_at) : null
  const startsAt = lead.trial_started_at ? new Date(lead.trial_started_at) : null
  const hasPaidPlan = !!lead.plan_type && lead.plan_type !== "free"
  const hasActiveSubscription =
    !!lead.subscription_status &&
    !["canceled", "inactive", "trialing", "free"].includes(lead.subscription_status)

  // Sempre prioriza conversão
  if (hasPaidPlan || hasActiveSubscription) {
    return "convertido"
  }

  // Trial expirado há mais de 7 dias sem conversão = perdido
  if (endsAt && endsAt.getTime() < now.getTime()) {
    const daysSinceExpiry = Math.floor((now.getTime() - endsAt.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceExpiry > 7) {
      return "perdido"
    }
  }

  // Trial expirado recentemente
  if ((lead.trial_used && !endsAt) || (endsAt && endsAt.getTime() < now.getTime())) {
    return "urgente"
  }

  // Trial ativo - verificar dias restantes
  if (endsAt) {
    const daysRemaining = Math.max(0, getRemainingTrialDays(endsAt))
    if (daysRemaining <= 2) {
      return "urgente"
    }
    return "trial_ativo"
  }

  // Trial iniciado mas sem data de término
  if (startsAt) {
    return "trial_ativo"
  }

  // Sem trial iniciado
  return "novo_lead"
}

export function PipelineKanbanBoard({ leads }: { leads: PipelineLead[] }) {
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const { groupedLeads, filteredCount } = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = leads.filter((lead) => {
      if (!normalizedSearch) return true
      return [
        lead.name,
        lead.email,
        lead.whatsapp,
        lead.profession,
        lead.company,
        lead.institution,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })

    const withStage: PipelineLeadWithStage[] = filtered.map((lead) => ({
      ...lead,
      resolvedStage: resolvePipelineStage(lead),
    }))

    const grouped: Record<PipelineStage, PipelineLeadWithStage[]> = {
      novo_lead: [],
      trial_ativo: [],
      urgente: [],
      contato_realizado: [],
      proposta_enviada: [],
      convertido: [],
      perdido: [],
    }

    withStage.forEach((lead) => {
      grouped[lead.resolvedStage].push(lead)
    })

    return {
      groupedLeads: grouped,
      filteredCount: filtered.length,
    }
  }, [leads, search, refreshKey])

  const handleStageChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Simplified Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Pipeline</h2>
          <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900/50">
            {filteredCount} leads
          </Badge>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar..."
          className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 w-64"
        />
      </div>

      {/* Horizontal Scrollable Columns */}
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 -mx-6 px-6 [scrollbar-width:thin] [scrollbar-color:rgb(51_65_85)_transparent]">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 flex flex-col border border-slate-800 bg-slate-950 rounded-lg overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-medium text-white">{stage.title}</h3>
              <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900/50 text-xs">
                {groupedLeads[stage.id]?.length ?? 0}
              </Badge>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-3">
                {(groupedLeads[stage.id] || []).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onStageChange={handleStageChange} />
                ))}
                {(groupedLeads[stage.id] || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Clock3 className="h-5 w-5 text-slate-600" />
                    <p className="text-xs text-slate-500">Nenhum lead</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  )
}


