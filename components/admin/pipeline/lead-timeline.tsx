"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  MessageSquare,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type TimelineEvent = {
  id: string
  type: "created" | "trial_started" | "trial_ends" | "note" | "followup" | "payment"
  date: string
  description: string
  metadata?: any
}

interface LeadTimelineProps {
  events: TimelineEvent[]
}

export function LeadTimeline({ events }: LeadTimelineProps) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Clock className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhuma atividade registrada</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-4 pl-4 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-slate-800">
      {events.map((event) => {
        const Icon = getEventIcon(event.type)
        const colorClass = getEventColor(event.type)

        return (
          <div key={event.id} className="relative">
            <div
              className={cn(
                "absolute -left-[21px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#030711] bg-slate-800",
                colorClass
              )}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 ml-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-slate-200">
                  {event.description}
                </span>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {format(new Date(event.date), "dd/MM/yy HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              {renderEventContent(event)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getEventIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "created":
      return UserPlus
    case "trial_started":
      return Clock
    case "trial_ends":
      return CalendarClock
    case "note":
      return MessageSquare
    case "followup":
      return CalendarClock
    case "payment":
      return CircleDollarSign
    default:
      return FileText
  }
}

function getEventColor(type: TimelineEvent["type"]) {
  switch (type) {
    case "created":
      return "bg-slate-600"
    case "trial_started":
      return "bg-cyan-600"
    case "trial_ends":
      return "bg-orange-600"
    case "note":
      return "bg-indigo-600"
    case "followup":
      return "bg-pink-600"
    case "payment":
      return "bg-green-600"
    default:
      return "bg-slate-600"
  }
}

function renderEventContent(event: TimelineEvent) {
  switch (event.type) {
    case "note":
      return (
        <div className="text-xs text-slate-400 space-y-1">
          <p className="whitespace-pre-wrap line-clamp-3">{event.metadata?.note}</p>
          {event.metadata?.creator && (
            <p className="text-[10px] text-slate-600">Por: {event.metadata.creator}</p>
          )}
        </div>
      )
    
    case "followup":
      return (
        <div className="text-xs text-slate-400">
          <p className="mb-1">{event.metadata?.note}</p>
          {event.metadata?.completed ? (
            <div className="flex items-center gap-1 text-green-400 text-[10px]">
              <CheckCircle2 className="h-3 w-3" />
              Concluído em {format(new Date(event.metadata.completed_at), "dd/MM HH:mm", { locale: ptBR })}
            </div>
          ) : (
            <span className="text-[10px] text-orange-400">Pendente</span>
          )}
        </div>
      )

    case "payment":
      return (
        <div className="text-xs text-slate-400">
          Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: event.metadata?.currency || "BRL" }).format(event.metadata?.amount || 0)}
        </div>
      )
    
    case "created":
      return event.metadata?.source ? (
        <div className="text-xs text-slate-500">
          Origem: {event.metadata.source}
        </div>
      ) : null

    default:
      return null
  }
}


