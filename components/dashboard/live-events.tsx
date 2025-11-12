"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import type { LiveEvent } from "@/lib/dashboard/events"
import { formatEventLabel, isEventSoon } from "@/lib/dashboard/events"

interface LiveEventsProps {
  initialEvents: LiveEvent[]
  initialReminders: string[]
}

const formatStatusLabel: Record<LiveEvent["status"], string> = {
  scheduled: "Agendada",
  live: "Ao vivo",
  completed: "Encerrada",
}

export function LiveEventsSection({ initialEvents, initialReminders }: LiveEventsProps) {
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents)
  const [reminders, setReminders] = useState<Set<string>>(new Set(initialReminders))
  const [busyId, setBusyId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const upcoming = useMemo(() => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const filtered = [...events]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .filter((event) => {
        const eventDate = new Date(event.startAt)
        return eventDate >= now && eventDate <= endOfMonth
      })
      .slice(0, 7)

    return filtered
  }, [events])

  const handleRealtimeUpdate = useCallback((payload: { new: any; old: any; eventType: string }) => {
    const row = payload.eventType === "DELETE" ? payload.old : payload.new
    if (!row?.id) {
      return
    }

    const mapped: LiveEvent = {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail_url,
      startAt: row.start_at,
      durationMinutes: row.duration_minutes ?? 60,
      instructorName: row.instructor_name ?? null,
      status: row.status ?? "scheduled",
      isFeatured: row.is_featured ?? false,
    }

    setEvents((prev) => {
      if (payload.eventType === "DELETE") {
        return prev.filter((event) => event.id !== mapped.id)
      }

      const exists = prev.find((event) => event.id === mapped.id)
      if (exists) {
        return prev.map((event) => (event.id === mapped.id ? { ...event, ...mapped } : event))
      }

      return [...prev, mapped]
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("public:live_events")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_events" }, handleRealtimeUpdate)
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [handleRealtimeUpdate])

  const toggleReminder = useCallback(async (eventId: string) => {
    // Disable reminders for mock events
    if (eventId.startsWith("live-mock-")) {
      return
    }

    setBusyId(eventId)
    try {
      const response = await fetch("/api/live-events/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      const data = await response.json()
      setReminders((prev) => {
        const next = new Set(prev)
        if (data.reminded) {
          next.add(eventId)
        } else {
          next.delete(eventId)
        }
        return next
      })
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleScroll = (direction: "prev" | "next") => {
    const container = scrollRef.current
    if (!container || container.scrollWidth <= container.clientWidth) return

    const scrollAmount = direction === "next" ? container.clientWidth * 0.7 : -container.clientWidth * 0.7
    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="rounded-3xl border border-[#132238] bg-[linear-gradient(140deg,#030b18_0%,#04132a_45%,#071f3d_100%)] p-6 text-white overflow-hidden">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-white">Lives próximas</h2>
        <p className="text-sm text-slate-300">Agenda de lives do mês. Veja o que vem aí e receba alerta quando estiver perto de começar.</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex min-w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          Nenhuma live agendada para os próximos dias. Retorne mais tarde para novidades.
        </div>
      ) : (
        <div className="relative -mx-6 px-6">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#030b18] via-[#04132a]/70 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#071f3d] via-[#04132a]/70 to-transparent" />

            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {upcoming.map((event) => {
                const soon = isEventSoon(event.startAt)
                const reminderActive = reminders.has(event.id)
                const statusLabel = formatStatusLabel[event.status]

                return (
                  <Card
                    key={event.id}
                    className={cn(
                      "group relative flex h-full w-[260px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border-2 text-[#E6EDF7] shadow-[0_25px_70px_rgba(8,17,35,0.55)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_110px_rgba(6,18,40,0.75)] sm:w-[300px]",
                      soon
                        ? "border-rose-500/40 bg-gradient-to-br from-rose-950/90 via-rose-900/70 to-slate-950/80 hover:border-rose-500/70"
                        : "border-[#0891b2]/20 bg-[#16243F] hover:border-[#2399B4]/60",
                      reminderActive && "ring-2 ring-primary/60"
                    )}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={event.thumbnail ?? "/placeholder.svg?height=200&width=400"}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 260px"
                        className="object-cover transition duration-[1200ms] ease-out group-hover:scale-110"
                        priority={false}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1627] via-[#0F192F]/80 to-transparent" />

                      {soon && (
                        <Badge className="absolute top-4 left-4 rounded-full border border-rose-500/60 bg-rose-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200 shadow-lg backdrop-blur">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                            Em breve
                          </span>
                        </Badge>
                      )}

                      {event.status === "live" && (
                        <Badge className="absolute top-4 left-4 rounded-full border border-red-500/60 bg-red-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200 shadow-lg backdrop-blur">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            Ao vivo
                          </span>
                        </Badge>
                      )}

                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-200">
                          <span>{statusLabel}</span>
                          <span>{event.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.instructorName ?? "Profissional"}</p>
                        <h3 className="mt-1 text-lg font-semibold leading-tight line-clamp-2 text-white">{event.title}</h3>
                        {event.description && (
                          <p className="mt-2 text-sm text-slate-200/80 line-clamp-2">{event.description}</p>
                        )}
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-4 text-xs text-slate-200/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatEventLabel(event.startAt)}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
                          variant={reminderActive ? "secondary" : "outline"}
                          disabled={busyId === event.id || event.id.startsWith("live-mock-")}
                          onClick={() => toggleReminder(event.id)}
                          aria-pressed={reminderActive}
                          title={event.id.startsWith("live-mock-") ? "Disponível em breve" : undefined}
                        >
                          {reminderActive ? "Lembrete ativo" : "Criar lembrete"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleScroll("prev")}
            aria-label="Ver lives anteriores"
            className="group absolute left-0 top-1/2 z-40 -translate-y-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#0B1627]/80 p-2 text-white shadow-2xl backdrop-blur transition hover:border-primary/80 hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll("next")}
            aria-label="Ver próximas lives"
            className="group absolute right-0 top-1/2 z-40 -translate-y-1/2 translate-x-1/2 rounded-full border border-white/30 bg-[#0B1627]/80 p-2 text-white shadow-2xl backdrop-blur transition hover:border-primary/80 hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
