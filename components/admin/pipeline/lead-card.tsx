"use client"

import Link from "next/link"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowUpRight,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Maximize2,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"
import { updatePipelineStage, deleteLead } from "@/app/actions/pipeline"
import { LeadDetailsDialog } from "./lead-details-dialog"

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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteLead(lead.id)
      if (result.success) {
        onStageChange?.()
        setDeleteDialogOpen(false)
      } else {
        console.error("Erro ao excluir lead:", result.message)
        alert(result.message)
      }
    } catch (error) {
      console.error("Erro ao excluir lead:", error)
      alert("Erro ao excluir lead")
    } finally {
      setIsDeleting(false)
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
          "group relative flex flex-col gap-2.5 rounded-xl border p-3 transition-all duration-200",
          // Surface e border do design system
          "bg-[#0f172a] border-[rgba(148,163,184,0.08)]",
          // Hover com glow sutil (signature)
          "hover:border-[rgba(148,163,184,0.12)] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]",
          isDragging && !isDragOverlay && "opacity-40",
          !isDragOverlay && "cursor-pointer active:cursor-grabbing",
          // Urgente: borda esquerda vermelha + glow vermelho
          isUrgent && "border-l-2 border-l-[#f87171] shadow-[0_0_20px_rgba(248,113,113,0.15)]"
        )}
        onClick={() => !isDragOverlay && setDetailsOpen(true)}
      >
        {/* Header refinado */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                {...listeners}
                {...attributes}
                className="text-[#64748b] hover:text-[#cbd5e1] cursor-grab active:cursor-grabbing p-1 hover:bg-[#131d37] rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <span className="font-semibold text-sm text-[#f8fafc] truncate block">
                {lead.name || "Lead sem nome"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#94a3b8] pl-[30px]">
              <span className="truncate">{lead.email}</span>
              {ageLabel && <span className="text-[#64748b]">• {ageLabel}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
               variant="ghost"
               size="icon"
               className="h-7 w-7 text-[#64748b] hover:text-[#06b6d4] hover:bg-[#131d37] opacity-0 group-hover:opacity-100 transition-all"
               onClick={() => setDetailsOpen(true)}
               title="Expandir detalhes"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#131d37]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0f172a] border-[rgba(148,163,184,0.12)]">
                <div className="px-2 py-1.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Mover para...
                </div>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStageChange(key as PipelineStage)}
                    className={cn(
                      "text-xs cursor-pointer text-[#cbd5e1] hover:bg-[#131d37]",
                      currentStage === key && "bg-[rgba(6,182,212,0.15)] text-[#06b6d4]"
                    )}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-[rgba(148,163,184,0.08)]" />
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
                <DropdownMenuItem onClick={() => setDetailsOpen(true)} className="text-xs cursor-pointer">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Ver detalhes e notas
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/usuarios/${lead.id}`} className="text-xs cursor-pointer flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-2" />
                    Ver perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[rgba(148,163,184,0.08)]" />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-xs cursor-pointer text-[#f59e0b] hover:text-[#fbbf24] hover:bg-[rgba(245,158,11,0.1)]"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Mover para lixeira
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Badges refinados */}
        <div className="flex flex-wrap gap-1.5 pl-[30px]">
          {isPaid ? (
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-[rgba(139,92,246,0.12)] text-[#c4b5fd] border border-[rgba(139,92,246,0.2)]">
              {lead.plan_type}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 px-2 text-[10px] font-normal border-[rgba(148,163,184,0.2)] text-[#94a3b8]">
              Free
            </Badge>
          )}

          {lead.profession && (
            <Badge variant="outline" className="h-5 px-2 text-[10px] font-normal border-[rgba(148,163,184,0.2)] text-[#cbd5e1]">
              {lead.profession}
            </Badge>
          )}

          {daysRemaining !== null && (
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-2 text-[10px] border",
                isUrgent
                  ? "bg-[rgba(248,113,113,0.12)] text-[#fca5a5] border-[rgba(248,113,113,0.3)] font-semibold"
                  : "bg-[rgba(6,182,212,0.12)] text-[#06b6d4] border-[rgba(6,182,212,0.3)]"
              )}
            >
              {daysRemaining === 0 ? "Expira hoje" : `${daysRemaining}d`}
            </Badge>
          )}
        </div>
      </div>

      <LeadDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        leadId={lead.id}
        leadName={lead.name}
        onStageChange={onStageChange}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0f172a] border-[rgba(148,163,184,0.12)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f8fafc]">
              Mover lead para lixeira
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94a3b8]">
              Tem certeza que deseja mover o lead <strong className="text-[#cbd5e1]">{lead.name || lead.email}</strong> para a lixeira?
              <div className="mt-3 p-3 bg-[#131d37] rounded-lg border border-[rgba(148,163,184,0.08)]">
                <p className="text-[#cbd5e1] text-xs mb-2">O lead será:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Removido do pipeline</li>
                  <li>Mantido na lixeira por 30 dias</li>
                  <li>Pode ser restaurado a qualquer momento</li>
                </ul>
              </div>
              <p className="mt-2 text-xs text-[#64748b]">
                As notas e follow-ups serão preservados e restaurados junto com o lead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-[#131d37] border-[rgba(148,163,184,0.12)] text-[#cbd5e1] hover:bg-[#1a2642] hover:text-[#f8fafc]"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#f59e0b] text-white hover:bg-[#d97706] border-0"
            >
              {isDeleting ? "Movendo..." : "Mover para lixeira"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
