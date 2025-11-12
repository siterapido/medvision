import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const formatIcsDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().replace(/[-:.]/g, "").replace(/\d+Z$/, "Z")
}

const encodeIcsLine = (value: string) => value.replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n")

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: events, error } = await supabase
      .from("live_events")
      .select("id,title,description,start_at,duration_minutes,status,instructor_name")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(100)

    if (error) {
      console.error("[api/live-events/calendar] erro ao buscar lives:", error)
      return NextResponse.json({ error: "Não foi possível gerar o calendário." }, { status: 500 })
    }

    const now = new Date().toISOString()
    const bodyLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Odonto GPT//Agenda de Lives//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Odonto GPT - Lives",
      `X-WR-TIMEZONE:UTC`,
    ]

    events?.forEach((event) => {
      const start = formatIcsDate(event.start_at)
      const durationMinutes = event.duration_minutes ?? 60
      const endDate = new Date(event.start_at)
      endDate.setMinutes(endDate.getMinutes() + durationMinutes)
      const end = formatIcsDate(endDate.toISOString())

      if (!start || !end) {
        return
      }

      bodyLines.push("BEGIN:VEVENT")
      bodyLines.push(`UID:${event.id}`)
      bodyLines.push(`SUMMARY:${encodeIcsLine(event.title)}`)
      if (event.description) {
        bodyLines.push(`DESCRIPTION:${encodeIcsLine(event.description)}`)
      }
      if (event.instructor_name) {
        bodyLines.push(`ORGANIZER:${encodeIcsLine(event.instructor_name)}`)
      }
      bodyLines.push(`DTSTAMP:${formatIcsDate(now)}`)
      bodyLines.push(`DTSTART:${start}`)
      bodyLines.push(`DTEND:${end}`)
      bodyLines.push("STATUS:CONFIRMED")
      bodyLines.push("CLASS:PUBLIC")
      bodyLines.push("END:VEVENT")
    })

    bodyLines.push("END:VCALENDAR")

    const payload = bodyLines.join("\r\n")

    return new NextResponse(payload, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch (error) {
    console.error("[api/live-events/calendar] erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao gerar o calendário." }, { status: 500 })
  }
}
