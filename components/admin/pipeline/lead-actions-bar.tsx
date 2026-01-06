"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  CalendarPlus,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type PipelineStage =
  | "novo_usuario"
  | "situacao"
  | "problema"
  | "implicacao"
  | "motivacao"
  | "convertido"
  | "nao_convertido"

const STAGE_LABELS: Record<PipelineStage, string> = {
  novo_usuario: "Novo Usuário",
  situacao: "Situação",
  problema: "Problema",
  implicacao: "Implicação",
  motivacao: "Motivação",
  convertido: "Convertido",
  nao_convertido: "Não Convertido",
}

interface LeadActionsBarProps {
  userId: string
  currentStage: PipelineStage | null
  email?: string | null
  whatsapp?: string | null
  onStageChange: (stage: PipelineStage) => void
  onAddNote: () => void
  onScheduleFollowup: () => void
  className?: string
}

export function LeadActionsBar({
  userId,
  currentStage,
  email,
  whatsapp,
  onStageChange,
  onAddNote,
  onScheduleFollowup,
  className,
}: LeadActionsBarProps) {
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null
  const emailUrl = email ? `mailto:${email}` : null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            {currentStage ? STAGE_LABELS[currentStage] : "Definir Etapa"}
            <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-xs text-slate-400">Mover para...</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onStageChange(key as PipelineStage)}
              className={cn(
                "text-xs cursor-pointer focus:bg-slate-700 focus:text-white",
                currentStage === key && "bg-slate-700/50 text-cyan-400"
              )}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-[1px] bg-slate-700 mx-1" />

      {whatsappUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-green-400 hover:bg-green-400/10"
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noreferrer" title="WhatsApp">
            <Phone className="h-4 w-4" />
          </a>
        </Button>
      )}

      {emailUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
          asChild
        >
          <a href={emailUrl} title="Email">
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
        onClick={onAddNote}
        title="Adicionar Nota"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-pink-400 hover:bg-pink-400/10"
        onClick={onScheduleFollowup}
        title="Agendar Follow-up"
      >
        <CalendarPlus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
        asChild
        title="Ver Perfil Completo"
      >
        <Link href={`/admin/usuarios/${userId}`}>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}


