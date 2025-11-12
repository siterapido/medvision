"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LiveEvent } from "@/lib/dashboard/events"

const toDateKey = (date: Date) => date.toISOString().split("T")[0]

interface CompactCalendarProps {
  events: LiveEvent[]
}

export function LiveCalendar({ events }: CompactCalendarProps) {
  const [focusDate, setFocusDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const eventsByDay = useMemo(() => {
    const map = new Map<string, LiveEvent[]>()
    events.forEach((event) => {
      const dayKey = event.startAt.split("T")[0]
      const bucket = map.get(dayKey) ?? []
      bucket.push(event)
      map.set(dayKey, bucket)
    })

    return map
  }, [events])

  const monthDays = useMemo(() => {
    const startOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1)
    const startDay = startOfMonth.getDay()
    const gridStart = new Date(startOfMonth)
    gridStart.setDate(gridStart.getDate() - startDay)

    return Array.from({ length: 35 }).map((_, index) => {
      const current = new Date(gridStart)
      current.setDate(current.getDate() + index)
      return current
    })
  }, [focusDate])

  const selectedEvents = useMemo(() => {
    const key = toDateKey(selectedDate)
    return eventsByDay.get(key) ?? []
  }, [eventsByDay, selectedDate])

  const changeMonth = (delta: number) => {
    setFocusDate((previous) => {
      const next = new Date(previous)
      next.setMonth(next.getMonth() + delta)
      return next
    })
  }

  return (
    <Card className="border border-slate-800 bg-slate-900/40 text-white">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Agenda de lives</CardTitle>
            <p className="text-sm text-slate-300">Calendário compacto conforme o guia UI/UX.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <button
              type="button"
              className="rounded-full border border-slate-700/70 px-3 py-1 transition hover:border-primary/60"
              onClick={() => changeMonth(-1)}
            >
              ←
            </button>
            <span className="px-3 py-1">
              {focusDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              className="rounded-full border border-slate-700/70 px-3 py-1 transition hover:border-primary/60"
              onClick={() => changeMonth(1)}
            >
              →
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="grid grid-cols-7 gap-1 border-t border-slate-800/60 px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((weekday) => (
            <span key={weekday} className="text-center">{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 px-2 pb-3">
          {monthDays.map((date) => {
            const key = toDateKey(date)
            const hasEvents = eventsByDay.has(key)
            const isCurrentMonth = date.getMonth() === focusDate.getMonth()
            const isSelected = toDateKey(selectedDate) === key
            const isToday = toDateKey(new Date()) === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(new Date(date))}
                className={cn(
                  "flex flex-col items-center justify-between rounded-2xl border px-1 py-2 text-[11px] transition-all",
                  isSelected ? "border-primary/60 bg-primary/10 text-white" : "border-transparent bg-slate-950/30",
                  !isCurrentMonth && "text-slate-500",
                  hasEvents ? "shadow-[0_0_12px_rgba(6,182,212,0.25)]" : ""
                )}
              >
                <span className={cn("text-sm font-semibold", isSelected ? "text-white" : isCurrentMonth ? "text-white" : "text-slate-500")}>
                  {date.getDate()}
                </span>
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.3em] text-slate-400">
                  {hasEvents ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" aria-hidden />
                  )}
                  {hasEvents ? `${eventsByDay.get(key)?.length} live` : "—"}
                </span>
                {isToday && (
                  <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-black">
                    Hoje
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="space-y-2 border-t border-slate-800/70 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Lives {selectedEvents.length > 0 ? "do dia selecionado" : "não programadas no dia"}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma live agendada para esta data.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((event) => (
                <li key={event.id} className="flex flex-col gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 text-sm text-slate-200">
                  <span className="font-semibold text-white">{event.title}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {event.startAt.split("T")[1]?.slice(0, 5)} · {event.instructorName ?? "Equipe"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Duração {event.durationMinutes} min · {event.status === "live" ? "Ao vivo" : event.status === "scheduled" ? "Programada" : "Encerrada"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
