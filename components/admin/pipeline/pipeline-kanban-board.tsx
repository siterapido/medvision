"use client"

import { useMemo, useState, useCallback } from "react"
import { Clock3, Inbox, FlaskConical, Brain, RefreshCw, Lock, CreditCard, Ghost, XCircle, ChevronDown } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"
import { updatePipelineStage } from "@/app/actions/pipeline"
import { LeadCard } from "./lead-card"

const LEADS_PER_COLUMN = 20

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
  // Métricas de engajamento (se disponíveis)
  chat_count?: number | null
  vision_used?: boolean | null
  last_active_at?: string | null
  // Vendedor responsável
  assigned_to?: string | null
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

/**
 * Funil comportamental Trial → Pro
 * Baseado em ações reais do usuário, não em metodologia de vendas
 */
type PipelineStage =
  | "cadastro"           // 📥 Cadastro Realizado
  | "primeira_consulta"  // 🧪 Primeira Consulta
  | "usou_vision"        // 🧠 Usou Odonto Vision
  | "uso_recorrente"     // 🔄 Uso Recorrente (3+ consultas)
  | "barreira_plano"     // 🚧 Barreira do Plano (limite atingido)
  | "convertido"         // 💳 Convertido (pagamento confirmado)
  | "risco_churn"        // 👻 Risco de Churn (inativo 3+ dias)
  | "perdido"            // ❌ Perdido (trial expirado sem conversão)

type StageConfig = {
  id: PipelineStage
  title: string
  emoji: string
  color: string
  icon: typeof Inbox
  description: string
}

const STAGES: StageConfig[] = [
  {
    id: "cadastro",
    title: "Cadastro",
    emoji: "📥",
    color: "border-t-slate-400",
    icon: Inbox,
    description: "Recém cadastrado"
  },
  {
    id: "primeira_consulta",
    title: "1ª Consulta",
    emoji: "🧪",
    color: "border-t-cyan-400",
    icon: FlaskConical,
    description: "Fez primeira consulta"
  },
  {
    id: "usou_vision",
    title: "Usou Vision",
    emoji: "🧠",
    color: "border-t-violet-400",
    icon: Brain,
    description: "Usou análise de imagem"
  },
  {
    id: "uso_recorrente",
    title: "Uso Recorrente",
    emoji: "🔄",
    color: "border-t-blue-400",
    icon: RefreshCw,
    description: "3+ consultas"
  },
  {
    id: "barreira_plano",
    title: "Barreira",
    emoji: "🚧",
    color: "border-t-amber-400",
    icon: Lock,
    description: "Atingiu limite do trial"
  },
  {
    id: "convertido",
    title: "Convertido",
    emoji: "💳",
    color: "border-t-green-400",
    icon: CreditCard,
    description: "Pagamento confirmado"
  },
  {
    id: "risco_churn",
    title: "Risco Churn",
    emoji: "👻",
    color: "border-t-orange-400",
    icon: Ghost,
    description: "Inativo há 3+ dias"
  },
  {
    id: "perdido",
    title: "Perdido",
    emoji: "❌",
    color: "border-t-red-400",
    icon: XCircle,
    description: "Trial expirado"
  },
]

type PipelineLeadWithStage = PipelineLead & { resolvedStage: PipelineStage }

/**
 * Resolve a etapa do pipeline baseado em comportamento real do usuário
 * Prioridades:
 * 1. Conversão (sempre prevalece)
 * 2. Stage manual definido pelo admin
 * 3. Resolução automática baseada em métricas de engajamento
 */
function resolvePipelineStage(lead: PipelineLead): PipelineStage {
  const now = new Date()
  const endsAt = lead.trial_ends_at ? new Date(lead.trial_ends_at) : null
  const lastActive = lead.last_active_at ? new Date(lead.last_active_at) : null
  const hasPaidPlan = !!lead.plan_type && lead.plan_type !== "free"
  const hasActiveSubscription =
    !!lead.subscription_status &&
    !["canceled", "inactive", "trialing", "free"].includes(lead.subscription_status)

  // 1. Sempre prioriza conversão
  if (hasPaidPlan || hasActiveSubscription) {
    return "convertido"
  }

  // 2. Se tem stage manual definido pelo admin, usa ele
  if (lead.pipeline_stage) {
    const validStages: PipelineStage[] = [
      "cadastro", "primeira_consulta", "usou_vision", "uso_recorrente",
      "barreira_plano", "convertido", "risco_churn", "perdido"
    ]
    if (validStages.includes(lead.pipeline_stage as PipelineStage)) {
      return lead.pipeline_stage as PipelineStage
    }
  }

  // 3. Resolução automática baseada em comportamento

  // Trial expirado sem conversão = Perdido
  if (endsAt && endsAt < now) {
    return "perdido"
  }

  // Inativo há mais de 3 dias = Risco de Churn
  if (lastActive) {
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceActive >= 3) {
      return "risco_churn"
    }
  }

  // Trial com menos de 2 dias restantes = Barreira do plano (momento crítico)
  if (endsAt) {
    const daysRemaining = getRemainingTrialDays(endsAt)
    if (daysRemaining <= 2 && daysRemaining > 0) {
      return "barreira_plano"
    }
  }

  // Usou Vision
  if (lead.vision_used) {
    return "usou_vision"
  }

  // Uso recorrente (3+ consultas)
  if (lead.chat_count && lead.chat_count >= 3) {
    return "uso_recorrente"
  }

  // Fez pelo menos uma consulta
  if (lead.chat_count && lead.chat_count >= 1) {
    return "primeira_consulta"
  }

  // Padrão: apenas cadastro
  return "cadastro"
}

interface DroppableColumnProps {
  stage: StageConfig
  leads: PipelineLeadWithStage[]
  isDragging: boolean
  onStageChange: () => void
  visibleCount: number
  hasMore: boolean
  onLoadMore: () => void
}

function DroppableColumn({ stage, leads, isDragging, onStageChange, visibleCount, hasMore, onLoadMore }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  const Icon = stage.icon
  const visibleLeads = leads.slice(0, visibleCount)
  const remainingCount = leads.length - visibleCount

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0 w-72 lg:w-[300px] flex flex-col rounded-2xl overflow-hidden transition-all duration-300",
        "bg-card/40 backdrop-blur-md",
        "border border-border/50",
        "group/column hover:bg-card/60",
        isOver && "border-primary/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-primary/20 bg-card"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 shrink-0 border-b border-border/40 relative overflow-hidden",
        "bg-gradient-to-b from-background/50 to-transparent"
      )}>
        {/* Top Color Accent */}
        <div className={cn("absolute top-0 left-0 right-0 h-[2px]", stage.color.replace('border-t-', 'bg-'))} />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-background/50 border border-border/50 flex items-center justify-center text-base shadow-sm">
            {stage.emoji}
          </div>
          <div>
            <h3 className="text-xs font-heading font-bold text-slate-100 leading-tight tracking-tight">
              {stage.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">
              {stage.description}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-border/50 shadow-sm min-w-[24px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="overflow-y-auto px-2.5 py-3 custom-scrollbar max-h-[calc(100vh-200px)]">
        <div className={cn("space-y-2 min-h-[100px]")}>
          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStageChange={onStageChange} />
          ))}
          {visibleLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center opacity-50 group-hover/column:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center border border-border/50">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium max-w-[100px]">
                {isDragging ? "Solte aqui" : "Nenhum lead nesta etapa"}
              </p>
            </div>
          )}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-[10px] text-muted-foreground hover:text-foreground h-7"
              onClick={onLoadMore}
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Carregar mais ({remainingCount} restantes)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function PipelineKanbanBoard({ leads, totalCount }: { leads: PipelineLead[]; totalCount: number }) {
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [columnPages, setColumnPages] = useState<Record<PipelineStage, number>>({
    cadastro: 1,
    primeira_consulta: 1,
    usou_vision: 1,
    uso_recorrente: 1,
    barreira_plano: 1,
    convertido: 1,
    risco_churn: 1,
    perdido: 1,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const loadMoreInColumn = useCallback((stageId: PipelineStage) => {
    setColumnPages(prev => ({
      ...prev,
      [stageId]: prev[stageId] + 1
    }))
  }, [])

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
      cadastro: [],
      primeira_consulta: [],
      usou_vision: [],
      uso_recorrente: [],
      barreira_plano: [],
      convertido: [],
      risco_churn: [],
      perdido: [],
    }

    const map: Record<string, PipelineLeadWithStage> = {}

    withStage.forEach((lead) => {
      const stage = lead.resolvedStage
      if (grouped[stage]) {
        grouped[stage].push(lead)
      } else {
        console.warn('[PipelineKanban] Unknown stage:', stage, 'for lead:', lead.id)
        grouped.cadastro.push(lead)
      }
      map[lead.id] = lead
    })

    return {
      groupedLeads: grouped,
      filteredCount: filtered.length,
      leadsMap: map,
    }
  }, [leads, search, refreshKey])

  // Reset column pages when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setColumnPages({
      cadastro: 1,
      primeira_consulta: 1,
      usou_vision: 1,
      uso_recorrente: 1,
      barreira_plano: 1,
      convertido: 1,
      risco_churn: 1,
      perdido: 1,
    })
  }

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

    const lead = leadsMap[leadId]
    if (!lead) return

    if (lead.resolvedStage === newStage) return

    await updatePipelineStage(leadId, newStage)
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
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-10 supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-baseline gap-3 w-full md:w-auto">
            <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">Pipeline de Conversão</h2>
            <div className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium shadow-sm">
              {filteredCount} leads {search && `(de ${totalCount} total)`}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Busca */}
            <div className="relative w-full md:w-72 group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar por nome, email, profissão..."
                className="pl-9 h-9 w-full bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 text-xs focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-muted transition-all rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
          <div className="flex flex-row gap-4 p-6 min-w-max h-full items-stretch">
            {STAGES.map((stage) => {
              const stageLeads = groupedLeads[stage.id] || []
              const visibleCount = columnPages[stage.id] * LEADS_PER_COLUMN
              const hasMore = stageLeads.length > visibleCount
              return (
                <DroppableColumn
                  key={stage.id}
                  stage={stage}
                  leads={stageLeads}
                  isDragging={isDragging}
                  onStageChange={handleStageChange}
                  visibleCount={visibleCount}
                  hasMore={hasMore}
                  onLoadMore={() => loadMoreInColumn(stage.id)}
                />
              )
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="opacity-90 rotate-1 cursor-grabbing scale-[1.02] transition-transform">
            <LeadCard lead={activeLead} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
