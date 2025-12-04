import Link from "next/link"

import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { LivePlayer } from "@/components/lives/live-player"
import { createClient } from "@/lib/supabase/server"
import type { LiveEvent } from "@/lib/dashboard/events"

const LIVE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const extractLiveId = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  return LIVE_UUID_REGEX.test(trimmed) ? trimmed : null
}

export default async function LivePage({ params }: { params: Promise<{ id?: string }> }) {
  const resolvedParams = await params
  const rawLiveId = resolvedParams?.id ?? null
  const liveId = extractLiveId(rawLiveId)

  if (!liveId) {
    const providedId = (rawLiveId ?? "").trim() || "indefinido"
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-200">
          Não foi possível carregar esta live. Verifique se o link está correto e tente novamente.
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-200">
          ID informado: <span className="font-mono text-white">{providedId}</span>
        </p>
        <Link
          href="/dashboard/cursos"
          className="text-xs font-semibold uppercase tracking-[0.35em] text-primary transition hover:text-white"
        >
          Voltar para Meus Cursos
        </Link>
      </div>
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Buscar dados da live
  const { data: liveData, error } = await supabase
    .from("live_events")
    .select(
      `
      id,
      title,
      description,
      thumbnail_url,
      live_url,
      start_at,
      duration_minutes,
      instructor_name,
      status,
      is_featured
    `,
    )
    .eq("id", liveId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar live:", error)
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-200">
          Não foi possível carregar a live no momento. ({error.message})
        </p>
      </div>
    )
  }

  if (!liveData) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-200">Live não encontrada.</p>
        <Link
          href="/dashboard/cursos"
          className="ml-4 text-sm text-primary transition hover:text-white"
        >
          Voltar para Meus Cursos
        </Link>
      </div>
    )
  }

  const live: LiveEvent = {
    id: liveData.id,
    title: liveData.title,
    description: liveData.description,
    thumbnail: liveData.thumbnail_url,
    liveUrl: liveData.live_url ?? null,
    startAt: liveData.start_at,
    durationMinutes: liveData.duration_minutes ?? 60,
    instructorName: liveData.instructor_name ?? null,
    status: (liveData.status as LiveEvent["status"]) ?? "scheduled",
    isFeatured: liveData.is_featured ?? false,
  }

  return (
    <DashboardScrollArea className="!px-0 !pt-0">
      <LivePlayer live={live} />
    </DashboardScrollArea>
  )
}

