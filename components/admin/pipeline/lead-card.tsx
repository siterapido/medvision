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
  User,
  Clock3,
  Mail
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
  // Vendedor responsável
  assigned_to?: string | null
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
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

  // Calculate trial progress (7 days total = 100%)
  const trialProgress = (() => {
    if (!lead.trial_started_at || !lead.trial_ends_at) return null
    const startDate = new Date(lead.trial_started_at)
    const endDate = new Date(lead.trial_ends_at)
    const now = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    return Math.round(progress)
  })()

  // Seller info
  const sellerName = lead.assigned_seller?.name || lead.assigned_seller?.email?.split("@")[0]

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
          "group relative flex flex-col gap-3 rounded-xl p-4 transition-all duration-300",
          // Base styles - Glassy feel
          "bg-card/40 backdrop-blur-sm border border-border/60 shadow-sm",
          // Hover effects
          "hover:bg-card/80 hover:border-border hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:shadow-cyan-900/10 hover:-translate-y-0.5",
          // Dragging state
          isDragging && !isDragOverlay && "opacity-30 grayscale",
          isDragOverlay && "rotate-2 scale-105 shadow-2xl shadow-primary/20 border-primary/30 bg-card z-50 cursor-grabbing",
          !isDragOverlay && "cursor-pointer active:cursor-grabbing",
          // Urgent state
          isUrgent && "border-l-2 border-l-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]"
        )}
        onClick={() => !isDragOverlay && setDetailsOpen(true)}
      >
        {/* Header refinado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <button
                {...listeners}
                {...attributes}
                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing -ml-1 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                title="Arraste para mover"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className={cn(
                "font-semibold text-sm truncate block transition-colors",
                isDragOverlay ? "text-primary" : "text-foreground group-hover:text-foreground"
              )}>
                {lead.name || "Lead sem nome"}
              </span>
            </div>

            <div className="flex items-center gap-4 pl-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium group-hover:text-muted-foreground/80 transition-colors">
                  <Mail className="w-3 h-3 opacity-60" />
                  <span className="truncate max-w-[140px]">{lead.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl rounded-xl p-1.5">
                <div className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Ações Rápidas
                </div>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStageChange(key as PipelineStage)}
                    className={cn(
                      "text-xs cursor-pointer text-foreground hover:bg-muted focus:bg-muted rounded-md py-2 px-3",
                      currentStage === key && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-50" />
                    Mover para {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border/50 my-1" />
                {whatsappUrl && (
                  <DropdownMenuItem asChild>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs cursor-pointer flex items-center text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-300 rounded-md py-2 px-3"
                    >
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      Conversar no WhatsApp
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setDetailsOpen(true)} className="text-xs cursor-pointer text-foreground hover:bg-muted rounded-md py-2 px-3">
                  <MessageSquare className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  Ver detalhes e notas
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/usuarios/${lead.id}`} className="text-xs cursor-pointer flex items-center text-foreground hover:bg-muted rounded-md py-2 px-3">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    Ver perfil completo
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50 my-1" />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-xs cursor-pointer text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300 rounded-md py-2 px-3"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Mover para lixeira
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Badges refinados */}
        <div className="flex flex-wrap gap-1.5 pl-5">
          {isPaid ? (
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-md">
              {lead.plan_type}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium border-border text-muted-foreground bg-muted/30 rounded-md">
              Free
            </Badge>
          )}

          {lead.profession && (
            <Badge variant="outline" className="h-5 px-2 text-[10px] font-normal border-border text-muted-foreground bg-muted/30 rounded-md">
              {lead.profession}
            </Badge>
          )}

          {daysRemaining !== null && (
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-2 text-[10px] border rounded-md font-medium",
                isUrgent
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              )}
            >
              <Clock3 className="w-3 h-3 mr-1 opacity-70" />
              {daysRemaining === 0 ? "Expira hoje" : `${daysRemaining}d`}
            </Badge>
          )}
        </div>

        {/* Trial Progress Bar */}
        {trialProgress !== null && (
          <div className="pl-5 space-y-1.5 mt-1">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                  isUrgent
                    ? "bg-gradient-to-r from-rose-500 to-amber-500"
                    : "bg-gradient-to-r from-cyan-600 to-blue-500"
                )}
                style={{ width: `${trialProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
              <span>Trial</span>
              <span>{daysRemaining !== null ? (daysRemaining === 0 ? "Fim" : `${Math.round(trialProgress)}%`) : "Expirado"}</span>
            </div>
          </div>
        )}

        {/* Footer info (Seller + Age) */}
        <div className="flex items-center justify-between pl-5 mt-1 pt-2 border-t border-border/40">
          {sellerName ? (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <User className="h-2.5 w-2.5 text-violet-400" />
              </div>
              <span className="text-[10px] font-medium text-violet-300">
                {sellerName}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium">Sem vendedor</span>
          )}

          {ageLabel && (
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {ageLabel}
            </span>
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
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Mover lead para lixeira
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja mover o lead <strong className="text-foreground">{lead.name || lead.email}</strong> para a lixeira?
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border/50">
                <p className="text-foreground text-xs mb-2">O lead será:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Removido do pipeline</li>
                  <li>Mantido na lixeira por 30 dias</li>
                  <li>Pode ser restaurado a qualquer momento</li>
                </ul>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                As notas e follow-ups serão preservados e restaurados junto com o lead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-muted border-border/50 text-foreground hover:bg-muted/80 hover:text-foreground"
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
