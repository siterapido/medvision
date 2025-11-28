"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { normalizeVideoUrl, isVideoFile } from "@/lib/video/normalize"
import {
  BookMarked,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  FileArchive,
  FileSpreadsheet,
  FileType,
  FolderDown,
  Image as ImageIcon,
  Link2,
  PlayCircle,
  ShieldCheck,
  Video,
  ChevronRight,
  Menu,
  X,
  FileIcon,
  Layout,
  Paperclip
} from "lucide-react"
import { kindFromMime } from "@/lib/attachments/mime"
import { isUuid } from "@/lib/validations/uuid"

export type CourseResourceType = "pdf" | "slides" | "checklist" | "link" | "video" | "template" | "outro"

export type LessonMaterial = {
  title: string
  description?: string | null
  type: CourseResourceType
  url: string
  is_downloadable?: boolean | null
}

export type CoursePlayerLesson = {
  id: string
  title: string
  description?: string | null
  module_title?: string | null
  module_id?: string | null
  video_url?: string | null
  duration_minutes?: number | null
  materials?: LessonMaterial[] | null
  available_at?: string | null
  order_index?: number | null
}

export type CoursePlayerCourse = {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  lessons_count?: number | null
  duration_minutes?: number | null
  difficulty?: string | null
  area?: string | null
  tags?: string | null
  updated_at?: string | null
  coming_soon?: boolean | null
  available_at?: string | null
  lessons?: CoursePlayerLesson[] | null
}

export type CoursePlayerModule = {
  id?: string | null
  title: string
  description?: string | null
  order_index?: number | null
}

const resourceTypeConfig: Record<CourseResourceType, { label: string; icon: LucideIcon; accent: string }> = {
  pdf: { label: "PDF", icon: FileText, accent: "text-amber-400" },
  slides: { label: "Slides", icon: FolderDown, accent: "text-blue-400" },
  checklist: { label: "Checklist", icon: ClipboardList, accent: "text-cyan-400" },
  template: { label: "Template", icon: BookMarked, accent: "text-orange-300" },
  video: { label: "Vídeo extra", icon: Video, accent: "text-red-400" },
  link: { label: "Link externo", icon: Link2, accent: "text-emerald-400" },
  outro: { label: "Outro", icon: ShieldCheck, accent: "text-purple-400" },
}

const formatMinutesLabel = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) return "—"
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (remainder > 0) parts.push(`${remainder}m`)
  return parts.join(" ")
}

const isComingSoon = (course: CoursePlayerCourse) => {
  if (!course.coming_soon) return false
  if (!course.available_at) return true
  return new Date(course.available_at) > new Date()
}



const persistLessonCompletion = async (courseId: string, lessonId: string) => {
  try {
    const response = await fetch("/api/courses/lessons/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ courseId, lessonId }),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null)
      console.error(
        "[course-player] falha ao salvar progresso:",
        errorPayload?.error ?? response.statusText,
      )
    }
  } catch (error) {
    console.error("[course-player] erro ao salvar progresso:", error)
  }
}

type CoursePlayerLessonState = CoursePlayerLesson & { completed: boolean }

export function CoursePlayer({
  course,
  modules = [],
  progress = 0,
}: {
  course: CoursePlayerCourse
  modules?: CoursePlayerModule[]
  progress?: number
}) {
  const getLessonFromUrl = () => {
    if (typeof window === "undefined") return ""
    try {
      const u = new URL(window.location.href)
      return u.searchParams.get("lesson") || ""
    } catch {
      return ""
    }
  }
  const normalizedLessons = useMemo<CoursePlayerLessonState[]>(() => {
    const seenLessonIds = new Set<string>()
    const uniqueLessons: CoursePlayerLesson[] = []
      ; (course.lessons ?? []).forEach((lesson) => {
        if (lesson.id) {
          if (seenLessonIds.has(lesson.id)) {
            return
          }
          seenLessonIds.add(lesson.id)
        }
        uniqueLessons.push(lesson)
      })
    const items = [...uniqueLessons]
    items.sort((a, b) => {
      if (a.order_index != null && b.order_index != null) {
        return a.order_index - b.order_index
      }
      if (a.order_index != null) {
        return -1
      }
      if (b.order_index != null) {
        return 1
      }
      return 0
    })
    const baselineCount = Math.round(((progress ?? 0) / 100) * (items.length || 1))
    return items.map((lesson, index) => ({
      ...lesson,
      completed: index < baselineCount,
    }))
  }, [course.lessons, progress])

  const [completedOverrides, setCompletedOverrides] = useState<Set<string>>(() => new Set())
  const [currentLessonId, setCurrentLessonId] = useState(() => {
    const fromUrl = getLessonFromUrl()
    return fromUrl || (normalizedLessons[0]?.id ?? "")
  })

  const lessons = useMemo(
    () =>
      normalizedLessons.map((lesson) => ({
        ...lesson,
        completed: lesson.completed || (lesson.id ? completedOverrides.has(lesson.id) : false),
      })),
    [normalizedLessons, completedOverrides],
  )

  const currentLesson = lessons.find((lesson) => lesson.id === currentLessonId) ?? lessons[0]
  const currentLessonIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId)
  const completedCount = lessons.filter((lesson) => lesson.completed).length
  const progressValue = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const allCompleted = lessons.length > 0 && completedCount === lessons.length

  const normalizedVideoUrl = normalizeVideoUrl(currentLesson?.video_url)
  const withBunnyParams = (u?: string | null) => {
    if (!u) return u ?? null
    try {
      const url = new URL(u)
      // Usa o player mais responsivo do Bunny e força a ocupar o iframe inteiro
      if (url.hostname === "iframe.mediadelivery.net") {
        url.hostname = "player.mediadelivery.net"
      }
      url.searchParams.set("responsive", "true")
      // Configurações básicas do player
      url.searchParams.set("preload", "true")
      url.searchParams.set("autoplay", "false")
      url.searchParams.set("muted", "false")
      url.searchParams.set("loop", "false")
      return url.toString()
    } catch {
      return u
    }
  }
  const videoWrapperRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsInstanceRef = useRef<any>(null)
  const isHlsStream = useMemo(() => {
    const u = normalizedVideoUrl ?? ""
    return u.toLowerCase().includes(".m3u8")
  }, [normalizedVideoUrl])

  useEffect(() => {
    if (!isHlsStream) {
      if (hlsInstanceRef.current) {
        try { hlsInstanceRef.current.destroy() } catch { }
        hlsInstanceRef.current = null
      }
      return
    }

    const video = videoRef.current
    if (!video || !normalizedVideoUrl) return

    const canNativePlay = video.canPlayType("application/vnd.apple.mpegurl")
    if (canNativePlay) {
      video.src = normalizedVideoUrl
      return
    }

    let cancelled = false
    const loadHls = async () => {
      if (typeof window === "undefined") return
      const existing = (window as any).Hls
      const bootstrap = async () => {
        if (existing) return existing
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("failed to load hls.js"))
          document.head.appendChild(script)
        })
        return (window as any).Hls
      }

      try {
        const HlsCtor = await bootstrap()
        if (cancelled || !HlsCtor) return
        const hls = new HlsCtor({ enableWorker: true })
        hls.attachMedia(video)
        hls.loadSource(normalizedVideoUrl)
        hlsInstanceRef.current = hls
      } catch { }
    }

    loadHls()

    return () => {
      cancelled = true
      if (hlsInstanceRef.current) {
        try { hlsInstanceRef.current.destroy() } catch { }
        hlsInstanceRef.current = null
      }
    }
  }, [isHlsStream, normalizedVideoUrl])

  const [attachments, setAttachments] = useState<Array<{ id: string; file_name: string; mime_type: string; size_bytes: number; created_at: string }>>([])

  useEffect(() => {
    const run = async () => {
      const id = currentLesson?.id
      if (!id || !isUuid(id)) {
        setAttachments([])
        return
      }
      try {
        const res = await fetch(`/api/lessons/${id}/attachments`, { cache: "no-store" })
        if (!res.ok) {
          setAttachments([])
          return
        }
        const json = await res.json().catch(() => ({}))
        setAttachments(Array.isArray(json.attachments) ? json.attachments : [])
      } catch (e) {
        setAttachments([])
      }
    }
    void run()
  }, [currentLesson?.id])

  const handleMarkComplete = async () => {
    if (!currentLesson) return

    setCompletedOverrides((prev) => {
      if (!currentLesson.id) {
        return prev
      }
      const next = new Set(prev)
      next.add(currentLesson.id)
      return next
    })

    const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLesson.id)
    if (currentIndex > -1 && currentIndex < lessons.length - 1) {
      const nextId = lessons[currentIndex + 1].id
      setCurrentLessonId(nextId)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("lesson", nextId)
        window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`)
      }
    }

    if (course.id && currentLesson.id) {
      void persistLessonCompletion(course.id, currentLesson.id)
    }
  }

  const handleDocumentAction = (resource: LessonMaterial, action: "view" | "download") => {
    if (typeof window === "undefined") return

    try {
      const parsed = new URL(resource.url)
      const proto = parsed.protocol
      if (proto !== "http:" && proto !== "https:") return

      if (action === "view") {
        window.open(parsed.toString(), "_blank", "noopener,noreferrer")
        return
      }

      const link = document.createElement("a")
      link.href = parsed.toString()
      link.download = resource.title
      link.target = "_blank"
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch { }
  }

  const groupedByModules = useMemo(() => {
    if (!lessons.length) {
      return [] as Array<{ module: CoursePlayerModule; lessons: CoursePlayerLessonState[] }>
    }

    if (modules.length > 0) {
      const byModuleId: Record<string, CoursePlayerLessonState[]> = {}
      lessons.forEach((l) => {
        const key = l.module_id ?? "__none__"
          ; (byModuleId[key] = byModuleId[key] || []).push(l)
      })

      const groups: Array<{ module: CoursePlayerModule; lessons: CoursePlayerLessonState[] }> = []

      const noneLessons = byModuleId["__none__"] || []
      if (noneLessons.length) {
        groups.push({ module: { id: null, title: "Aulas Extras", description: "Aulas sem módulo", order_index: -1 }, lessons: noneLessons })
      }

      modules.forEach((m) => {
        const items = byModuleId[m.id ?? ""] || []
        items.sort((a, b) => {
          if (a.order_index != null && b.order_index != null) return a.order_index - b.order_index
          if (a.order_index != null) return -1
          if (b.order_index != null) return 1
          return 0
        })
        groups.push({ module: m, lessons: items })
      })

      groups.sort((a, b) => {
        const ao = a.module.order_index ?? 0
        const bo = b.module.order_index ?? 0
        if (ao !== bo) return ao - bo
        return a.module.title.localeCompare(b.module.title, "pt-BR")
      })

      return groups
    }

    const byTitle: Record<string, CoursePlayerLessonState[]> = {}
    lessons.forEach((l) => {
      const key = (l.module_title ?? "Geral").trim() || "Geral"
        ; (byTitle[key] = byTitle[key] || []).push(l)
    })
    return Object.entries(byTitle)
      .map(([title, items]) => ({
        module: { id: null, title, order_index: title === "Geral" ? -1 : 0 }, lessons: items.sort((a, b) => {
          if (a.order_index != null && b.order_index != null) return a.order_index - b.order_index
          if (a.order_index != null) return -1
          if (b.order_index != null) return 1
          return 0
        })
      }))
      .sort((a, b) => {
        const ao = a.module.order_index ?? 0
        const bo = b.module.order_index ?? 0
        if (ao !== bo) return ao - bo
        return a.module.title.localeCompare(b.module.title, "pt-BR")
      })
  }, [lessons, modules])

  const [activeTab, setActiveTab] = useState<"overview" | "materials">("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const totalMaterialsCount = (currentLesson?.materials?.length ?? 0) + attachments.length
  const scrollToVideo = () => {
    if (!videoWrapperRef.current) return
    videoWrapperRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (isComingSoon(course)) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Em Breve</h1>
          <p className="text-slate-500">Este curso estará disponível em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-full w-full overflow-x-hidden bg-gradient-to-b from-[#0b1627] via-[#0f172a] to-[#0b1627]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(6,182,212,0.08),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(8,145,178,0.06),transparent_24%),radial-gradient(circle_at_50%_85%,rgba(14,116,144,0.08),transparent_28%)]" />
      <div className="relative mx-auto box-border flex w-full max-w-screen-xl flex-col gap-6 overflow-hidden px-3 pb-12 pt-4 sm:px-4 lg:flex-row lg:gap-8 lg:p-6">
        <div
          className="sticky top-0 z-30 mx-auto box-border w-full max-w-screen-xl bg-[#0f172a]/90 px-3 pb-3 pt-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:px-4 lg:hidden"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#67e8f9]/80">Curso</p>
              <p className="truncate text-sm font-semibold text-white">{course.title || "Curso"}</p>
              <p className="text-[11px] text-slate-300">{progressValue}% concluído</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={scrollToVideo}
                aria-label="Ir para o vídeo"
              >
                <PlayCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="blue"
                size="sm"
                className="shadow-[0_10px_25px_rgba(6,182,212,0.4)]"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir trilhas e aulas"
              >
                <Menu className="h-4 w-4" />
                Trilhas
              </Button>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="mx-auto flex min-w-0 w-full max-w-3xl flex-1 flex-col gap-5 lg:mx-0 lg:max-w-none lg:gap-6">
            <div
              ref={videoWrapperRef}
              data-testid="course-player-video"
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/5 min-h-[240px] sm:min-h-[300px] lg:min-h-[420px]"
            >
              {normalizedVideoUrl ? (
                isVideoFile(normalizedVideoUrl) ? (
                  isHlsStream ? (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 h-full w-full object-contain"
                      controls
                      controlsList="nodownload"
                    />
                  ) : (
                    <video
                      src={normalizedVideoUrl}
                      className="absolute inset-0 h-full w-full object-contain"
                      controls
                      controlsList="nodownload"
                    />
                  )
                ) : (
                  (() => {
                    const isBunny = (normalizedVideoUrl ?? "").includes("mediadelivery.net")
                    const src = isBunny ? withBunnyParams(normalizedVideoUrl) ?? normalizedVideoUrl : normalizedVideoUrl
                    return (
                      <iframe
                        src={src ?? ""}
                        loading="lazy"
                        title={currentLesson?.title ?? "Vídeo do curso"}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{ border: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      />
                    )
                  })()
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Video className="h-12 w-12 opacity-20" />
                  <p>Selecione uma aula para assistir</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-slate-200/80 backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#0891b2]">
                    <span>Aula {currentLessonIndex + 1}</span>
                    <span className="h-1 w-1 rounded-full bg-[#0891b2]/20" />
                    <span>{currentLesson?.module_title || "Módulo Geral"}</span>
                  </div>
                  <h1 className="text-2xl font-bold leading-tight text-[#0f172a]">{currentLesson?.title}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    size="sm"
                    variant={currentLesson?.completed ? "secondary" : "default"}
                    className={cn(
                      "gap-2 rounded-full font-medium transition-all",
                      currentLesson?.completed
                        ? "border border-green-200 bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-[#0891b2] text-white shadow-lg shadow-[#0891b2]/20 hover:bg-[#0e7490]"
                    )}
                    onClick={handleMarkComplete}
                    aria-label={currentLesson?.completed ? "Aula marcada como concluída" : "Marcar aula como vista"}
                  >
                    {currentLesson?.completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Concluída
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como vista
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="sm:hidden rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label={sidebarOpen ? "Fechar lista de aulas" : "Abrir lista de aulas"}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 border-b border-slate-200/80">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={cn(
                      "relative pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#0891b2]",
                      activeTab === "overview" ? "text-[#0891b2]" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Visão Geral
                    {activeTab === "overview" && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#0891b2]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("materials")}
                    className={cn(
                      "relative pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#0891b2]",
                      activeTab === "materials" ? "text-[#0891b2]" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Materiais Complementares
                    {totalMaterialsCount > 0 && (
                      <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {totalMaterialsCount}
                      </span>
                    )}
                    {activeTab === "materials" && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#0891b2]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="py-2">
                {activeTab === "overview" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="leading-relaxed text-slate-700">
                      {currentLesson?.description || "Nenhuma descrição disponível para esta aula."}
                    </p>
                    {currentLesson?.duration_minutes && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span>Duração estimada: {formatMinutesLabel(currentLesson.duration_minutes)}</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "materials" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {currentLesson?.materials && currentLesson.materials.length > 0 ? (
                        currentLesson.materials.map((resource, idx) => {
                          const config = resourceTypeConfig[resource.type]
                          const Icon = config.icon
                          return (
                            <div
                              key={idx}
                              className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#0891b2] hover:bg-[#0891b2]/5"
                            >
                              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100", config.accent)}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">{resource.title}</p>
                                <p className="text-xs text-slate-500">{config.label}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-[#0891b2]"
                                onClick={() => handleDocumentAction(resource, "view")}
                                aria-label={`Abrir material: ${resource.title}`}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="col-span-full py-8 text-center text-slate-500">
                          <Layout className="mb-2 mx-auto h-8 w-8 opacity-20" />
                          <p>Nenhum material complementar disponível.</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <Paperclip className="h-4 w-4" />
                        <span>Arquivos anexados</span>
                        {attachments.length > 0 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            {attachments.length}
                          </span>
                        )}
                      </div>
                      {attachments.length > 0 ? (
                        attachments.map((att) => (
                          <div key={att.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#0891b2] hover:bg-[#0891b2]/5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Paperclip className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{att.file_name}</p>
                              <p className="text-xs text-slate-500">
                                {(att.size_bytes / (1024 * 1024)).toFixed(1)} MB • {att.mime_type}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-[#0891b2]"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/lessons/${currentLesson?.id}/attachments/${att.id}/download`)
                                  const json = await res.json().catch(() => ({}))
                                  if (json.url) window.open(json.url, "_blank")
                                } catch { }
                              }}
                              aria-label={`Baixar anexo: ${att.file_name}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-500">
                          <FileIcon className="mb-2 mx-auto h-8 w-8 opacity-20" />
                          <p>Nenhum arquivo anexado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-[min(92vw,360px)] transform bg-[#0f172a] transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:w-96 lg:translate-x-0 lg:border-l lg:border-[#334155] lg:bg-transparent",
              sidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"
            )}
          >
            <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#1e293b] to-[#0f172a] lg:rounded-2xl lg:border lg:border-[#334155]">
              <div className="flex items-center justify-between border-b border-[#334155] p-4">
                <div>
                  <h3 className="font-semibold text-white">Conteúdo do Curso</h3>
                  <p className="text-xs text-[#94a3b8]">{progressValue}% concluído</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#94a3b8] hover:bg-[#334155] hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="px-4 pb-2 pt-4">
                <Progress value={progressValue} className="h-1.5 bg-[#334155]" />
              </div>

              <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={groupedByModules.map(g => g.module.id || g.module.title)} className="w-full">
                  {groupedByModules.map((group, i) => (
                    <AccordionItem key={i} value={group.module.id || group.module.title} className="border-[#334155]">
                      <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium text-[#f1f5f9] hover:text-white hover:no-underline data-[state=open]:bg-[#334155]/30">
                        <span className="truncate">{group.module.title}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 pt-0">
                        <div className="flex flex-col">
                          {group.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setCurrentLessonId(lesson.id)
                                if (typeof window !== "undefined") {
                                  const url = new URL(window.location.href)
                                  url.searchParams.set("lesson", lesson.id)
                                  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`)
                                }
                                setSidebarOpen(false)
                              }}
                              className={cn(
                                "flex items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-[#334155]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]",
                                currentLessonId === lesson.id
                                  ? "border-[#06b6d4] bg-[#334155]/50"
                                  : "border-transparent"
                              )}
                            >
                              <div className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                                lesson.completed
                                  ? "border-green-400 bg-green-500 text-white"
                                  : currentLessonId === lesson.id
                                    ? "border-[#06b6d4] text-[#06b6d4]"
                                    : "border-[#475569] text-[#94a3b8]"
                              )}>
                                {lesson.completed ? <CheckCircle2 className="h-3 w-3" /> : (lesson.order_index ?? 0) + 1}
                              </div>
                              <div className="space-y-1">
                                <p className={cn(
                                  "text-sm font-medium leading-tight",
                                  currentLessonId === lesson.id ? "text-white" : "text-[#f1f5f9]"
                                )}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#94a3b8]">
                                  {lesson.duration_minutes && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatMinutesLabel(lesson.duration_minutes)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
