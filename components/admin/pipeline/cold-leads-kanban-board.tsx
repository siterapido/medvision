"use client"

import { useMemo, useState, useCallback } from "react"
import { Clock3, Phone, Mail, MoreHorizontal, Trash2, GripVertical, MapPin, GraduationCap, User, Maximize2, LinkIcon, ChevronDown } from "lucide-react"
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
import { useDraggable } from "@dnd-kit/core"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { updateLeadStatus, deleteLead, type LeadStatus, type LeadWithSeller, assignSellerToLead } from "@/app/actions/leads"
import { PipelineFilters, type PipelineFiltersState } from "./pipeline-filters"
import { BulkActionsBar } from "./bulk-actions-bar"
import { SellerAssignmentSelect } from "./seller-assignment-select"
import { UnifiedLeadDialog } from "./unified-lead-dialog"

type StageConfig = {
  id: LeadStatus
  title: string
  color: string
  icon: string
}

const LEADS_PER_COLUMN = 20

// New conversion-focused stages (replacing SPIM)
const STAGES: StageConfig[] = [
  { id: "novo_lead", title: "Novo Lead", color: "border-t-slate-400", icon: "📥" },
  { id: "contato_realizado", title: "Contato Realizado", color: "border-t-cyan-400", icon: "📞" },
  { id: "interessado", title: "Interessado", color: "border-t-purple-400", icon: "🎯" },
  { id: "aguardando_cadastro", title: "Aguardando Cadastro", color: "border-t-amber-400", icon: "⏳" },
  { id: "convertido", title: "Convertido", color: "border-t-green-400", icon: "✅" },
  { id: "descartado", title: "Descartado", color: "border-t-red-400", icon: "❌" },
]

type LeadWithStage = LeadWithSeller & { resolvedStage: LeadStatus }

/**
 * Normaliza número de telefone para WhatsApp
 */
function sanitizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("55") ? digits : `55${digits}`
}

interface ColdLeadCardProps {
  lead: LeadWithStage
  onStageChange: () => void
  isDragOverlay?: boolean
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  selectionMode?: boolean
  onOpenDetails?: (leadId: string) => void
}

function ColdLeadCard({
  lead,
  onStageChange,
  isDragOverlay = false,
  isSelected = false,
  onSelect,
  selectionMode = false,
  onOpenDetails
}: ColdLeadCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: isDragOverlay || selectionMode,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const ageLabel = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
  const phoneDigits = sanitizePhone(lead.phone)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const isConverted = lead.status === "convertido"
  const hasConvertedProfile = !!lead.converted_to_user_id
  const sellerName = lead.assigned_seller?.name || lead.assigned_seller?.email?.split("@")[0]

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(lead.id, checked)
  }

  // Se estiver em modo de seleção, clicar no card seleciona
  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault()
      e.stopPropagation()
      onSelect?.(lead.id, !isSelected)
    } else if (!isDragOverlay) {
      onOpenDetails?.(lead.id)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o lead "${lead.name || lead.phone}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteLead(lead.id)
      onStageChange()
    } catch (error) {
      console.error("Erro ao deletar lead:", error)
      alert("Erro ao deletar lead")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-xl p-2.5 transition-all duration-300",
        // Base styles
        "bg-card/40 backdrop-blur-sm border border-border/60 shadow-sm",
        // Hover effects
        "hover:bg-card/80 hover:border-border hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-0.5",
        isDragging && !isDragOverlay && "opacity-30 grayscale",
        isDragOverlay && "rotate-2 scale-105 shadow-2xl shadow-primary/20 border-primary/30 bg-card z-50 cursor-grabbing",
        !isDragOverlay && !selectionMode && "cursor-pointer active:cursor-grabbing",
        isConverted && "border-l-2 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent",
        isSelected && "ring-1 ring-primary border-primary bg-primary/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0 flex items-start gap-1.5">
          {/* Checkbox para seleção */}
          <div className={cn(
            "mt-0.5 transition-opacity duration-200 shrink-0",
            isSelected || selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              {!selectionMode && (
                <button
                  {...listeners}
                  {...attributes}
                  className="text-muted-foreground hover:text-foreground -ml-1 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              )}
              <span className={cn(
                "font-semibold text-xs truncate block transition-colors",
                isDragOverlay ? "text-primary" : "text-foreground"
              )}>
                {lead.name || "Lead sem nome"}
              </span>
              {/* Conversion link indicator */}
              {hasConvertedProfile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LinkIcon className="h-2.5 w-2.5 text-green-400 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Vinculado a um usuario trial
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2 pl-3">
              {lead.email && (
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Mail className="w-2.5 h-2.5 opacity-60" />
                  <span className="truncate max-w-[90px]">{lead.email}</span>
                </div>
              )}
              <span className="text-[9px] text-muted-foreground font-mono">{lead.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
            onClick={() => onOpenDetails?.(lead.id)}
          >
            <Maximize2 className="h-2.5 w-2.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                disabled={isDeleting}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-xl rounded-xl p-1">
              {whatsappUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] cursor-pointer flex items-center text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Phone className="h-2.5 w-2.5 mr-1.5" />
                    WhatsApp
                  </a>
                </DropdownMenuItem>
              )}
              {lead.email && (
                <DropdownMenuItem asChild>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[10px] cursor-pointer flex items-center"
                  >
                    <Mail className="h-2.5 w-2.5 mr-1.5" />
                    Email
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onOpenDetails?.(lead.id)}
                className="text-[10px] cursor-pointer"
              >
                <Maximize2 className="h-2.5 w-2.5 mr-1.5" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50 my-1" />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-[10px] cursor-pointer text-rose-400 hover:bg-rose-500/10"
                disabled={isDeleting}
              >
                <Trash2 className="h-2.5 w-2.5 mr-1.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Rows */}
      {(lead.state || lead.ies) && (
        <div className="flex flex-wrap gap-1.5 text-[9px] text-muted-foreground pl-4">
          {lead.state && (
            <div className="flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5 opacity-60" />
              <span>{lead.state}</span>
            </div>
          )}
          {lead.ies && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-2.5 w-2.5 opacity-60" />
              <span className="truncate max-w-[100px]">{lead.ies}</span>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1 pl-4">
        {lead.source && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-normal border-border bg-muted/30 cursor-help">
                  {lead.source}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {lead.sheet_source_name ? (
                  <>
                    <p className="font-semibold">{lead.sheet_source_name}</p>
                    {lead.sheet_source_description && <p className="opacity-70">{lead.sheet_source_description}</p>}
                  </>
                ) : (
                  <p>Origem: {lead.source}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isConverted && (
          <Badge className="h-4 px-1.5 text-[8px] font-medium bg-green-500/10 text-green-400 border-green-500/20">
            Convertido
          </Badge>
        )}
      </div>

      {/* Footer: Seller + Age */}
      <div className="flex items-center justify-between pl-4 mt-0.5 pt-1.5 border-t border-border/40">
        {sellerName ? (
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <User className="h-2 w-2 text-violet-400" />
            </div>
            <span className="text-[9px] font-medium text-violet-300">
              {sellerName}
            </span>
          </div>
        ) : (
          <span className="text-[9px] text-muted-foreground font-medium">Sem vendedor</span>
        )}

        <span className="text-[9px] text-muted-foreground">
          {ageLabel}
        </span>
      </div>
    </div>
  )
}

interface DroppableColumnProps {
  stage: StageConfig
  leads: LeadWithStage[]
  isDragging: boolean
  onStageChange: () => void
  selectedIds: string[]
  onSelectLead: (id: string, selected: boolean) => void
  onSelectAll: (ids: string[], selected: boolean) => void
  selectionMode: boolean
  onOpenDetails: (leadId: string) => void
  visibleCount: number
  hasMore: boolean
  onLoadMore: () => void
}

function DroppableColumn({
  stage,
  leads,
  isDragging,
  onStageChange,
  selectedIds,
  onSelectLead,
  onSelectAll,
  selectionMode,
  onOpenDetails,
  visibleCount,
  hasMore,
  onLoadMore
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  const visibleLeads = leads.slice(0, visibleCount)
  const remainingCount = leads.length - visibleCount
  const columnLeadIds = leads.map(lead => lead.id)
  const allSelected = leads.length > 0 && columnLeadIds.every(id => selectedIds.includes(id))
  const someSelected = columnLeadIds.some(id => selectedIds.includes(id))

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(columnLeadIds, checked)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0 w-[300px] flex flex-col bg-card/40 rounded-xl overflow-hidden transition-colors border-t-2 border border-border/30",
        stage.color,
        isOver && "bg-muted/60 ring-1 ring-inset ring-primary/30"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2.5 py-2 shrink-0 bg-muted/30 gap-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {leads.length > 0 && (
            <div className="relative shrink-0">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className={cn(
                  "border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5",
                  someSelected && !allSelected && "bg-primary/30 border-primary"
                )}
              />
              {someSelected && !allSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm" />
                </div>
              )}
            </div>
          )}
          <span className="text-xs">{stage.icon}</span>
          <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wide truncate">{stage.title}</h3>
        </div>
        <span className="text-[9px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
          {leads.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
        <div className={cn("p-2 space-y-2 min-h-[100px]")}>
          {visibleLeads.map((lead) => (
            <ColdLeadCard
              key={lead.id}
              lead={lead}
              onStageChange={onStageChange}
              isSelected={selectedIds.includes(lead.id)}
              onSelect={onSelectLead}
              selectionMode={selectionMode}
              onOpenDetails={onOpenDetails}
            />
          ))}
          {visibleLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center opacity-40">
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground font-medium">
                {isDragging ? "Solte aqui" : "Vazio"}
              </p>
            </div>
          )}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-[9px] text-muted-foreground hover:text-foreground h-6"
              onClick={onLoadMore}
            >
              <ChevronDown className="h-2.5 w-2.5 mr-1" />
              Carregar mais ({remainingCount} restantes)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ColdLeadsKanbanBoardProps {
  leads: LeadWithSeller[]
}

export function ColdLeadsKanbanBoard({ leads }: ColdLeadsKanbanBoardProps) {
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState<PipelineFiltersState>({
    source: [],
    sheetName: [],
    state: [],
    ies: [],
  })
  const [columnPages, setColumnPages] = useState<Record<LeadStatus, number>>({
    novo_lead: 1,
    contato_realizado: 1,
    interessado: 1,
    aguardando_cadastro: 1,
    convertido: 1,
    descartado: 1,
  })
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [selectedLeadName, setSelectedLeadName] = useState<string | null>(null)

  const loadMoreInColumn = useCallback((stageId: LeadStatus) => {
    setColumnPages(prev => ({
      ...prev,
      [stageId]: prev[stageId] + 1
    }))
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filterOptions = useMemo(() => {
    const uniqueSources = Array.from(new Set(leads.map(l => l.source).filter(Boolean))).sort() as string[]
    const uniqueSheets = Array.from(new Set(leads.map(l => l.sheet_source_name).filter(Boolean))).sort() as string[]
    const uniqueStates = Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort() as string[]
    const uniqueIes = Array.from(new Set(leads.map(l => l.ies).filter(Boolean))).sort() as string[]

    return {
      sources: uniqueSources.map(v => ({ value: v, label: v, count: leads.filter(l => l.source === v).length })),
      sheetNames: uniqueSheets.map(v => ({ value: v, label: v, count: leads.filter(l => l.sheet_source_name === v).length })),
      states: uniqueStates.map(v => ({ value: v, label: v, count: leads.filter(l => l.state === v).length })),
      ies: uniqueIes.map(v => ({ value: v, label: v, count: leads.filter(l => l.ies === v).length })),
    }
  }, [leads])

  const { groupedLeads, filteredCount, leadsMap } = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    
    const filtered = leads.filter((lead) => {
      // Filtro de texto
      const matchesSearch = !normalizedSearch || [
        lead.name,
        lead.email,
        lead.phone,
        lead.source,
        lead.notes,
        lead.state,
        lead.ies,
        lead.sheet_source_name
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))

      if (!matchesSearch) return false

      // Filtros estruturados
      if (filters.source.length > 0 && (!lead.source || !filters.source.includes(lead.source))) return false
      if (filters.sheetName.length > 0 && (!lead.sheet_source_name || !filters.sheetName.includes(lead.sheet_source_name))) return false
      if (filters.state.length > 0 && (!lead.state || !filters.state.includes(lead.state))) return false
      if (filters.ies.length > 0 && (!lead.ies || !filters.ies.includes(lead.ies))) return false

      return true
    })

    const withStage: LeadWithStage[] = filtered.map((lead) => ({
      ...lead,
      resolvedStage: lead.status,
    }))

    // New conversion-focused stages
    const grouped: Record<LeadStatus, LeadWithStage[]> = {
      novo_lead: [],
      contato_realizado: [],
      interessado: [],
      aguardando_cadastro: [],
      convertido: [],
      descartado: [],
    }

    const map: Record<string, LeadWithStage> = {}

    withStage.forEach((lead) => {
      grouped[lead.resolvedStage].push(lead)
      map[lead.id] = lead
    })

    return {
      groupedLeads: grouped,
      filteredCount: filtered.length,
      leadsMap: map,
    }
  }, [leads, search, refreshKey, filters])

  const handleStageChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleDragStart = (event: DragStartEvent) => {
    // Se tiver itens selecionados, não permite drag
    if (selectedIds.length > 0) return
    
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsDragging(false)

    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as LeadStatus

    // Encontrar o lead no mapa
    const lead = leadsMap[leadId]
    if (!lead) return

    // Se já está na mesma etapa, não faz nada
    if (lead.resolvedStage === newStage) return

    // Atualizar no banco
    await updateLeadStatus(leadId, newStage)

    // Refresh para mostrar nova posição
    handleStageChange()
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setIsDragging(false)
  }

  const handleSelectLead = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleSelectAll = (ids: string[], selected: boolean) => {
    if (selected) {
      // Adiciona todos os IDs que ainda não estão selecionados
      setSelectedIds(prev => {
        const newIds = ids.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    } else {
      // Remove todos os IDs da coluna
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleActionComplete = () => {
    handleStageChange()
  }

  const handleOpenDetails = (leadId: string) => {
    const lead = leadsMap[leadId]
    setSelectedLeadId(leadId)
    setSelectedLeadName(lead?.name || null)
    setDialogOpen(true)
  }

  const activeLead = activeId ? leadsMap[activeId] : null
  const selectionMode = selectedIds.length > 0

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="flex flex-col gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-medium text-foreground">Prospecção</h2>
                <span className="text-[10px] text-muted-foreground font-mono px-2 py-0.5 rounded-full bg-muted border border-border">
                  {filteredCount} leads
                </span>
              </div>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setColumnPages({
                    novo_lead: 1,
                    contato_realizado: 1,
                    interessado: 1,
                    aguardando_cadastro: 1,
                    convertido: 1,
                    descartado: 1,
                  })
                }}
                placeholder="Filtrar (Nome, UF, IES, Origem...)"
                className="h-7 w-56 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground text-[10px]"
              />
            </div>
            
            {/* Filters Row */}
            <PipelineFilters 
              filters={filters} 
              onFilterChange={setFilters} 
              options={filterOptions} 
            />
          </div>

          {/* Board */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex flex-row gap-3 p-4 min-w-max h-full items-stretch">
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
                    selectedIds={selectedIds}
                    onSelectLead={handleSelectLead}
                    onSelectAll={handleSelectAll}
                    selectionMode={selectionMode}
                    onOpenDetails={handleOpenDetails}
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
            <div className="opacity-80 rotate-2 cursor-grabbing scale-105">
              <ColdLeadCard lead={activeLead} isDragOverlay onStageChange={handleStageChange} onOpenDetails={handleOpenDetails} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onActionComplete={handleActionComplete}
      />

      {/* Lead Details Dialog */}
      {selectedLeadId && (
        <UnifiedLeadDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type="cold_lead"
          id={selectedLeadId}
          name={selectedLeadName}
          onStageChange={handleStageChange}
        />
      )}
    </>
  )
}
