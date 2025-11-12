import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const ReminderSchema = z.object({
  eventId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const payload = await request.json()
    const parsed = ReminderSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 })
    }

    const { eventId } = parsed.data

    const { data: existing, error: fetchError } = await supabase
      .from("live_event_reminders")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .maybeSingle()

    if (fetchError) {
      console.error("[api/live-events/reminders] falha ao buscar lembrete:", fetchError)
      return NextResponse.json({ error: "Não foi possível acessar os lembretes." }, { status: 500 })
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("live_event_reminders")
        .delete()
        .eq("id", existing.id)

      if (deleteError) {
        console.error("[api/live-events/reminders] falha ao remover lembrete:", deleteError)
        return NextResponse.json({ error: "Não foi possível remover o lembrete." }, { status: 500 })
      }

      return NextResponse.json({ reminded: false })
    }

    const { error: insertError } = await supabase.from("live_event_reminders").insert({
      user_id: user.id,
      event_id: eventId,
    })

    if (insertError) {
      console.error("[api/live-events/reminders] falha ao criar lembrete:", insertError)
      return NextResponse.json({ error: "Não foi possível criar o lembrete." }, { status: 500 })
    }

    return NextResponse.json({ reminded: true })
  } catch (error) {
    console.error("[api/live-events/reminders] erro inesperado:", error)
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 })
  }
}
