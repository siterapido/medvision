export type LiveEventStatus = "scheduled" | "live" | "completed"

export interface LiveEvent {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  liveUrl: string | null
  startAt: string
  durationMinutes: number
  instructorName: string | null
  status: LiveEventStatus
  isFeatured: boolean
}

export const formatEventLabel = (startAt: string) => {
  const date = new Date(startAt)
  if (Number.isNaN(date.getTime())) {
    return "Horário indisponível"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const isEventSoon = (startAt: string) => {
  const date = new Date(startAt)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  const now = new Date()
  return date.getTime() - now.getTime() <= 1000 * 60 * 60 * 24
}

export const sortEventsByStart = (events: LiveEvent[]) => {
  return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}
