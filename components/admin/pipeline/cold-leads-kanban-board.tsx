"use client"

import { useMemo, useState } from "react"
import { Clock3, Phone, Mail, MoreHorizontal, Trash2, GripVertical } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { updateLeadStatus, deleteLead, type Lead, type LeadStatus } from "@/app/actions/leads"

type StageConfig = {
  id: LeadStatus
  title: string
  color: string
}

const STAGES: StageConfig[] = [
  { id: "novo_lead", title: "Novo Lead", color: "border-t-slate-400" },
  { id: "situacao", title: "Situação (S)", color: "border-t-cyan-400" },
  { id: "problema", title: "Problema (P)", color: "border-t-sky-400" },
  { id: "implicacao", title: "Implicação (I)", color: "border-t-violet-400" },
  { id: "motivacao", title: "Motivação (M)", color: "border-t-fuchsia-400" },
  { id: "convertido", title: "Convertido", color: "border-t-green-400" },
]

type LeadWithStage = Lead & { resolvedStage: LeadStatus }

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
}

function ColdLeadCard({ lead, onStageChange, isDragOverlay = false }: ColdLeadCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: isDragOverlay,
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
      className={cn(
        "group relative flex flex-col gap-2 rounded-md border border-slate-700 bg-slate-800/60 p-2.5 hover:border-slate-600 transition-all",
        isDragging && !isDragOverlay && "opacity-50",
        !isDragOverlay && "cursor-grab active:cursor-grabbing",
        isConverted && "border-l-2 border-l-green-400 bg-green-500/10"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <button
              {...listeners}
              {...attributes}
              className="text-slate-600 hover:text-slate-400 -ml-1 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <span className="font-medium text-sm text-slate-200 truncate block">
              {lead.name || "Lead sem nome"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 pl-4">
            {lead.email && (
              <>
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </>
            )}
            <span>• {ageLabel}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-slate-200"
              disabled={isDeleting}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
            {whatsappUrl && (
              <DropdownMenuItem asChild>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs cursor-pointer flex items-center"
                >
                  <Phone className="h-3 w-3 mr-2" />
                  WhatsApp
                </a>
              </DropdownMenuItem>
            )}
            {lead.email && (
              <DropdownMenuItem asChild>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-xs cursor-pointer flex items-center"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  Email
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-xs cursor-pointer text-red-400 hover:text-red-300"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pl-4">
        <span className="text-[10px] text-slate-400 font-mono">{lead.phone}</span>
        {lead.source && (
          <span className="h-4 px-1.5 text-[9px] font-normal border border-slate-600 text-slate-300 rounded">
            {lead.source}
          </span>
        )}
        {isConverted && (
          <span className="h-4 px-1.5 text-[9px] font-medium bg-green-400/20 text-green-200 rounded border-0">
            Convertido
          </span>
        )}
      </div>
    </div>
  )
}

interface DroppableColumnProps {
  stage: StageConfig
  leads: LeadWithStage[]
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
            <ColdLeadCard key={lead.id} lead={lead} onStageChange={onStageChange} />
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

interface ColdLeadsKanbanBoardProps {
  leads: Lead[]
}

export function ColdLeadsKanbanBoard({ leads }: ColdLeadsKanbanBoardProps) {
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
        lead.phone,
        lead.source,
        lead.notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })

    const withStage: LeadWithStage[] = filtered.map((lead) => ({
      ...lead,
      resolvedStage: lead.status,
    }))

    const grouped: Record<LeadStatus, LeadWithStage[]> = {
      novo_lead: [],
      situacao: [],
      problema: [],
      implicacao: [],
      motivacao: [],
      convertido: [],
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
            <h2 className="text-lg font-medium text-slate-100">Prospecção</h2>
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
            <ColdLeadCard lead={activeLead} isDragOverlay onStageChange={handleStageChange} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

