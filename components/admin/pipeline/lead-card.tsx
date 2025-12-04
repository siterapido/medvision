"use client"

import Link from "next/link"
import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  | "novo_lead"
  | "trial_ativo"
  | "urgente"
  | "contato_realizado"
  | "proposta_enviada"
  | "convertido"
  | "perdido"

const STAGE_LABELS: Record<PipelineStage, string> = {
  novo_lead: "Novo Lead",
  trial_ativo: "Trial Ativo",
  urgente: "Urgente",
  contato_realizado: "Contato Realizado",
  proposta_enviada: "Proposta Enviada",
  convertido: "Convertido",
  perdido: "Perdido",
}

function formatDate(value?: string | null) {
  if (!value) return null
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return null
  }
}

function sanitizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("55") ? digits : `55${digits}`
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
}

function InfoRow({ icon, label }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 px-2 py-1.5">
      <span className="shrink-0">{icon}</span>
      <span className="text-xs text-slate-200 leading-tight">{label}</span>
    </div>
  )
}

interface LeadCardProps {
  lead: PipelineLead
  onStageChange?: () => void
}

export function LeadCard({ lead, onStageChange }: LeadCardProps) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const daysRemaining = lead.trial_ends_at
    ? Math.max(0, getRemainingTrialDays(lead.trial_ends_at))
    : null
  const formattedEnd = formatDate(lead.trial_ends_at)
  const formattedStart = formatDate(lead.trial_started_at)
  const ageLabel = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
    : null
  const phoneDigits = sanitizePhone(lead.whatsapp)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const isPaid = !!lead.plan_type && lead.plan_type !== "free"

  const handleStageChange = async (newStage: PipelineStage | null) => {
    setIsUpdating(true)
    try {
      await updatePipelineStage(lead.id, newStage)
      onStageChange?.()
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStage = (lead.pipeline_stage as PipelineStage) || null

  return (
    <>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <p className="text-base font-semibold text-white leading-tight">
              {lead.name || "Lead sem nome"}
            </p>
            <p className="text-xs text-slate-400">{lead.email || "Sem e-mail"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                className="h-8 border-slate-600 text-slate-300 hover:text-white text-xs"
              >
                {currentStage ? STAGE_LABELS[currentStage] : "Mover"}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => handleStageChange("novo_lead")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "novo_lead" && "bg-slate-700"
                )}
              >
                Novo Lead
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("trial_ativo")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "trial_ativo" && "bg-slate-700"
                )}
              >
                Trial Ativo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("urgente")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "urgente" && "bg-slate-700"
                )}
              >
                Urgente
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("contato_realizado")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "contato_realizado" && "bg-slate-700"
                )}
              >
                Contato Realizado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("proposta_enviada")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "proposta_enviada" && "bg-slate-700"
                )}
              >
                Proposta Enviada
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("convertido")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "convertido" && "bg-slate-700"
                )}
              >
                Convertido
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStageChange("perdido")}
                className={cn(
                  "text-slate-200 hover:bg-slate-700",
                  currentStage === "perdido" && "bg-slate-700"
                )}
              >
                Perdido
              </DropdownMenuItem>
              {currentStage && (
                <>
                  <div className="h-px bg-slate-700 my-1" />
                  <DropdownMenuItem
                    onClick={() => handleStageChange(null)}
                    className="text-slate-400 hover:bg-slate-700"
                  >
                    Limpar etapa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2">
          {isPaid ? (
            <Badge className="bg-indigo-500/20 text-indigo-100 border-indigo-500/40">
              Plano {lead.plan_type}
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-100 border-emerald-500/30">
              Plano free
            </Badge>
          )}
          {daysRemaining !== null && (
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-100">
              {daysRemaining} dia{daysRemaining === 1 ? "" : "s"} restantes
            </Badge>
          )}
          {lead.profession && (
            <Badge variant="outline" className="border-slate-600 text-slate-100">
              {lead.profession}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-200">
          <InfoRow icon={<Mail className="h-4 w-4 text-cyan-300" />} label={lead.email || "Sem e-mail"} />
          <InfoRow
            icon={<Phone className="h-4 w-4 text-emerald-300" />}
            label={lead.whatsapp || "Sem WhatsApp"}
          />
          {formattedEnd && (
            <InfoRow
              icon={<Clock3 className="h-4 w-4 text-amber-300" />}
              label={`Termina em ${formattedEnd}${daysRemaining !== null ? ` (${daysRemaining}d)` : ""}`}
            />
          )}
          {formattedStart && (
            <InfoRow
              icon={<Target className="h-4 w-4 text-purple-300" />}
              label={`Início em ${formattedStart}`}
            />
          )}
          {lead.company && (
            <InfoRow icon={<Sparkles className="h-4 w-4 text-cyan-300" />} label={lead.company} />
          )}
          {lead.institution && (
            <InfoRow icon={<Sparkles className="h-4 w-4 text-indigo-300" />} label={lead.institution} />
          )}
          {ageLabel && (
            <InfoRow
              icon={<Clock3 className="h-4 w-4 text-slate-300" />}
              label={`Criado ${ageLabel.replace("menos de", "<")}`}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappUrl && (
            <Button asChild variant="secondary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <Phone className="h-4 w-4 mr-1" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200 hover:text-white"
            onClick={() => setNotesOpen(true)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Notas
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:text-white" asChild>
            <Link href={`/admin/usuarios/${lead.id}`}>
              Ver perfil
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
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


