"use client"

import Link from "next/link"
import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  GripVertical,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
} from "lucide-react"
import { useDraggable } from "@dnd-kit/core"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"
import { updatePipelineStage } from "@/app/actions/pipeline"
import { NotesModal } from "./notes-modal"

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

const STAGE_LABELS: Record<PipelineStage, string> = {
  novo_usuario: "Novo Usuário",
  situacao: "Situação",
  problema: "Problema",
  implicacao: "Implicação",
  motivacao: "Motivação",
  convertido: "Convertido",
}

function sanitizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("55") ? digits : `55${digits}`
}

interface LeadCardProps {
  lead: PipelineLead
  onStageChange?: () => void
  isDragOverlay?: boolean
}

export function LeadCard({ lead, onStageChange, isDragOverlay = false }: LeadCardProps) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: isDragOverlay,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const daysRemaining = lead.trial_ends_at
    ? Math.max(0, getRemainingTrialDays(lead.trial_ends_at))
    : null
  
  const ageLabel = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
    : null
    
  const phoneDigits = sanitizePhone(lead.whatsapp)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const isPaid = !!lead.plan_type && lead.plan_type !== "free"

  const handleStageChange = async (newStage: PipelineStage | null) => {
    setIsUpdating(true)
    try {
      const result = await updatePipelineStage(lead.id, newStage)
      if (result.success) {
        onStageChange?.()
      } else {
        console.error("Erro ao atualizar etapa:", result.message)
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStage = (lead.pipeline_stage as PipelineStage) || null
  const isUrgent = daysRemaining !== null && daysRemaining <= 2

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex flex-col gap-2 rounded-md border border-slate-700 bg-slate-800/60 p-2.5 hover:border-slate-600 transition-all",
          isDragging && !isDragOverlay && "opacity-50",
          !isDragOverlay && "cursor-grab active:cursor-grabbing",
          isUrgent && "border-l-2 border-l-red-400 bg-red-500/10"
        )}
      >
        {/* Header Compacto */}
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
              <span className="truncate">{lead.email}</span>
              {ageLabel && <span>• {ageLabel}</span>}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-slate-200"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
                Mover para...
              </div>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleStageChange(key as PipelineStage)}
                  className={cn(
                    "text-xs cursor-pointer",
                    currentStage === key && "bg-slate-800 text-cyan-400"
                  )}
                >
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-slate-700" />
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
              <DropdownMenuItem onClick={() => setNotesOpen(true)} className="text-xs cursor-pointer">
                <MessageSquare className="h-3 w-3 mr-2" />
                Ver notas
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/usuarios/${lead.id}`} className="text-xs cursor-pointer flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-2" />
                  Ver perfil
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges Minimalistas */}
        <div className="flex flex-wrap gap-1.5 pl-4">
          {isPaid ? (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-medium bg-indigo-400/20 text-indigo-200 hover:bg-indigo-400/30 border-0">
              {lead.plan_type}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal border-slate-600 text-slate-400">
              Free
            </Badge>
          )}
          
          {lead.profession && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal border-slate-600 text-slate-300">
              {lead.profession}
            </Badge>
          )}

          {daysRemaining !== null && (
            <Badge 
              variant="outline" 
              className={cn(
                "h-4 px-1.5 text-[9px] border-0",
                isUrgent 
                  ? "bg-red-400/20 text-red-200 font-medium" 
                  : "bg-cyan-400/20 text-cyan-200"
              )}
            >
              {daysRemaining === 0 ? "Expirou hoje" : `${daysRemaining}d restantes`}
            </Badge>
          )}
        </div>
      </div>

      <NotesModal
        open={notesOpen}
        onOpenChange={setNotesOpen}
        userId={lead.id}
        userName={lead.name}
      />
    </>
  )
}
