"use client"

import { useMemo, useState } from "react"
import { Clock3 } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"
import { updatePipelineStage } from "@/app/actions/pipeline"
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
  | "novo_usuario"
  | "situacao"
  | "problema"
  | "implicacao"
  | "motivacao"
  | "convertido"

type StageConfig = {
  id: PipelineStage
  title: string
  color: string
}

const STAGES: StageConfig[] = [
  { id: "novo_usuario", title: "Novo Usuário", color: "border-t-slate-400" },
  { id: "situacao", title: "Situação (S)", color: "border-t-cyan-400" },
  { id: "problema", title: "Problema (P)", color: "border-t-sky-400" },
  { id: "implicacao", title: "Implicação (I)", color: "border-t-violet-400" },
  { id: "motivacao", title: "Motivação (M)", color: "border-t-fuchsia-400" },
  { id: "convertido", title: "Convertido", color: "border-t-green-400" },
]

type PipelineLeadWithStage = PipelineLead & { resolvedStage: PipelineStage }

/**
 * Resolve a etapa do pipeline para um lead baseado na metodologia SPIN
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

  // Resolução automática baseada no status do trial (metodologia SPIM adaptada)
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

  // Trial ativo - calcular progresso baseado em dias decorridos (SPIM adaptado)
  if (endsAt && startsAt) {
    const daysRemaining = Math.max(0, getRemainingTrialDays(endsAt))
    const totalDays = Math.ceil((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = totalDays - daysRemaining
    
    // Trial com ≤2 dias restantes → Motivação (M) - momento crítico
    if (daysRemaining <= 2) {
      return "motivacao"
    }

    // Trial com >50% concluído → Implicação (I) - risco de perder
    if (totalDays > 0 && daysElapsed / totalDays >= 0.5) {
      return "implicacao"
    }

    // Trial iniciado mas ainda no início → Problema (P) - engajamento baixo
    return "problema"
  }

  // Trial iniciado mas sem data de término → Problema (P)
  if (startsAt) {
    return "problema"
  }

  // Sem trial iniciado → Novo Usuário - recém cadastrado
  return "novo_usuario"
}

interface DroppableColumnProps {
  stage: StageConfig
  leads: PipelineLeadWithStage[]
  isDragging: boolean
  onStageChange: () => void
}

function DroppableColumn({ stage, leads, isDragging, onStageChange }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0 w-72 h-[calc(100vh-140px)] flex flex-col bg-slate-800/40 rounded-lg overflow-hidden transition-colors border-t-2",
        stage.color,
        isOver && "bg-slate-700/60 ring-1 ring-inset ring-cyan-400/30"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0 bg-slate-700/30">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">{stage.title}</h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
          {leads.length}
        </span>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1">
        <div className={cn("p-2 space-y-2 min-h-[100px]")}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStageChange={onStageChange} />
          ))}
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center opacity-40">
              <Clock3 className="h-4 w-4 text-slate-600" />
              <p className="text-[10px] text-slate-500 font-medium">
                {isDragging ? "Solte aqui" : "Vazio"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function PipelineKanbanBoard({ leads }: { leads: PipelineLead[] }) {
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const { groupedLeads, filteredCount, leadsMap } = useMemo(() => {
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
      novo_usuario: [],
      situacao: [],
      problema: [],
      implicacao: [],
      motivacao: [],
      convertido: [],
    }

    const map: Record<string, PipelineLeadWithStage> = {}

    withStage.forEach((lead) => {
      grouped[lead.resolvedStage].push(lead)
      map[lead.id] = lead
    })

    return {
      groupedLeads: grouped,
      filteredCount: filtered.length,
      leadsMap: map,
    }
  }, [leads, search, refreshKey])

  const handleStageChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsDragging(false)

    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as PipelineStage

    // Encontrar o lead no mapa
    const lead = leadsMap[leadId]
    if (!lead) return

    // Se já está na mesma etapa, não faz nada
    if (lead.resolvedStage === newStage) return

    // Atualizar no banco
    await updatePipelineStage(leadId, newStage)
    
    // Refresh para mostrar nova posição
    handleStageChange()
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setIsDragging(false)
  }

  const activeLead = activeId ? leadsMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-full bg-[#030711]">
        {/* Minimalist Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-900">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-medium text-slate-100">Conversão Trial</h2>
            <span className="text-xs text-slate-500 font-mono">
              {filteredCount} leads
            </span>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar leads..."
            className="h-8 w-64 bg-slate-950 border-slate-800 text-slate-300 placeholder:text-slate-600 text-xs focus:ring-1 focus:ring-slate-700"
          />
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex flex-row gap-3 p-4 min-w-max h-full items-stretch">
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                leads={groupedLeads[stage.id] || []}
                isDragging={isDragging}
                onStageChange={handleStageChange}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="opacity-80 rotate-2 cursor-grabbing scale-105">
            <LeadCard lead={activeLead} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
