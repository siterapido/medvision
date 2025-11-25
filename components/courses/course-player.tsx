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

  useEffect(() => {
    const idFromUrl = getLessonFromUrl()
    if (idFromUrl && idFromUrl !== currentLessonId) {
      setCurrentLessonId(idFromUrl)
    }
  }, [])

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
  const withBunnyResponsive = (u?: string | null) => {
    if (!u) return u ?? null
    try {
      const url = new URL(u)
      url.searchParams.set("responsive", "true")
      url.searchParams.set("preload", "true")
      url.searchParams.set("autoplay", "false")
      url.searchParams.set("muted", "false")
      url.searchParams.set("loop", "false")
      return url.toString()
    } catch {
      return u
    }
  }
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hlsInstance, setHlsInstance] = useState<any>(null)
  const isHlsStream = useMemo(() => {
    const u = normalizedVideoUrl ?? ""
    return u.toLowerCase().includes(".m3u8")
  }, [normalizedVideoUrl])

  useEffect(() => {
    if (!isHlsStream) {
      if (hlsInstance) {
        try { hlsInstance.destroy() } catch { }
        setHlsInstance(null)
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
        setHlsInstance(hls)
      } catch { }
    }

    loadHls()

    return () => {
      cancelled = true
      if (hlsInstance) {
        try { hlsInstance.destroy() } catch { }
        setHlsInstance(null)
      }
    }
  }, [isHlsStream, normalizedVideoUrl])

  const [attachments, setAttachments] = useState<Array<{ id: string; file_name: string; mime_type: string; size_bytes: number; created_at: string }>>([])

  useEffect(() => {
    const run = async () => {
      const id = currentLesson?.id
      if (!id) return
      try {
        const res = await fetch(`/api/lessons/${id}/attachments`, { cache: "no-store" })
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

  const [activeTab, setActiveTab] = useState<"overview" | "materials" | "files">("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isComingSoon(course)) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-white">Em Breve</h1>
          <p className="text-slate-400">Este curso estará disponível em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden p-4 lg:p-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:overflow-visible pr-2">
        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
          {normalizedVideoUrl ? (
            isVideoFile(normalizedVideoUrl) ? (
              isHlsStream ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  controlsList="nodownload"
                />
              ) : (
                <video
                  src={normalizedVideoUrl}
                  className="w-full h-full object-contain"
                  controls
                  controlsList="nodownload"
                />
              )
            ) : (
              (() => {
                const isBunny = (normalizedVideoUrl ?? "").includes("mediadelivery.net")
                const src = isBunny ? withBunnyResponsive(normalizedVideoUrl) ?? normalizedVideoUrl : normalizedVideoUrl
                return (
                  <div className="relative w-full h-full overflow-hidden">
                    <iframe
                      src={src ?? ""}
                      title={currentLesson?.title ?? "Vídeo do curso"}
                      className={isBunny ? "absolute inset-0 w-full h-full block" : "w-full h-full block"}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      frameBorder="0"
                      style={isBunny ? { border: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%", margin: 0, padding: 0, transform: "scale(2)", transformOrigin: "center" } : undefined}
                    />
                  </div>
                )
              })()
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-200">
              <Video className="h-12 w-12 opacity-20" />
              <p>Selecione uma aula para assistir</p>
            </div>
          )}
        </div>

        {/* Lesson Info & Controls */}
        <div className="mt-6 space-y-6 px-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white">
                <span>Aula {currentLessonIndex + 1}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{currentLesson?.module_title || "Módulo Geral"}</span>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{currentLesson?.title}</h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                size="sm"
                variant={currentLesson?.completed ? "secondary" : "default"}
                className={cn(
                  "gap-2 rounded-full font-medium transition-all",
                  currentLesson?.completed
                    ? "bg-green-500/20 text-white hover:bg-green-500/30 border border-green-500/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
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
                size="icon"
                className="lg:hidden rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Fechar lista de aulas" : "Abrir lista de aulas"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-white/10">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-md",
                  activeTab === "overview" ? "text-white" : "text-slate-200 hover:text-white"
                )}
              >
                Visão Geral
                {activeTab === "overview" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-md",
                  activeTab === "materials" ? "text-white" : "text-slate-200 hover:text-white"
                )}
              >
                Materiais Complementares
                {currentLesson?.materials && currentLesson.materials.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                    {currentLesson.materials.length}
                  </span>
                )}
                {activeTab === "materials" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-md",
                  activeTab === "files" ? "text-white" : "text-slate-200 hover:text-white"
                )}
              >
                Arquivos Anexados
                {attachments.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                    {attachments.length}
                  </span>
                )}
                {activeTab === "files" && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 rounded-t-full" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-2">
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-slate-200 leading-relaxed">
                  {currentLesson?.description || "Nenhuma descrição disponível para esta aula."}
                </p>
                {currentLesson?.duration_minutes && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span>Duração estimada: {formatMinutesLabel(currentLesson.duration_minutes)}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "materials" && (
              <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentLesson?.materials && currentLesson.materials.length > 0 ? (
                  currentLesson.materials.map((resource, idx) => {
                    const config = resourceTypeConfig[resource.type]
                    const Icon = config.icon
                    return (
                      <div
                        key={idx}
                        className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-white/10 hover:bg-white/[0.07]"
                      >
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20", config.accent)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{resource.title}</p>
                          <p className="text-xs text-slate-400">{config.label}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => handleDocumentAction(resource, "view")}
                          aria-label={`Abrir material: ${resource.title}`}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-300">
                    <Layout className="mx-auto h-8 w-8 opacity-20 mb-2" />
                    <p>Nenhum material complementar disponível.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {attachments.length > 0 ? (
                  attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-white/10 hover:bg-white/[0.07]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20 text-slate-300">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">{att.file_name}</p>
                        <p className="text-xs text-slate-400">
                          {(att.size_bytes / (1024 * 1024)).toFixed(1)} MB • {att.mime_type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
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
                  <div className="py-8 text-center text-slate-300">
                    <FileIcon className="mx-auto h-8 w-8 opacity-20 mb-2" />
                    <p>Nenhum arquivo anexado.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 transform bg-[#0b1424] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-96 lg:bg-transparent lg:border-l lg:border-white/5",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col bg-[#0d172a] lg:rounded-2xl lg:border lg:border-white/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h3 className="font-semibold text-white">Conteúdo do Curso</h3>
              <p className="text-xs text-slate-400">{progressValue}% concluído</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 pt-4 pb-2">
            <Progress value={progressValue} className="h-1.5 bg-white/10" />
          </div>

          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={groupedByModules.map(g => g.module.id || g.module.title)} className="w-full">
              {groupedByModules.map((group, i) => (
                <AccordionItem key={i} value={group.module.id || group.module.title} className="border-white/5">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium text-slate-200 hover:text-white hover:no-underline data-[state=open]:bg-white/5">
                    <span className="truncate text-left">{group.module.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-0">
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
                            "flex items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            currentLessonId === lesson.id
                              ? "border-blue-500 bg-blue-500/5"
                              : "border-transparent"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                            lesson.completed
                              ? "border-green-500 bg-green-500 text-white"
                              : currentLessonId === lesson.id
                                ? "border-blue-500 text-blue-500"
                                : "border-slate-600 text-slate-600"
                          )}>
                            {lesson.completed ? <CheckCircle2 className="h-3 w-3" /> : (lesson.order_index ?? 0) + 1}
                          </div>
                          <div className="space-y-1">
                            <p className={cn(
                              "text-sm font-medium leading-tight",
                              currentLessonId === lesson.id ? "text-blue-400" : "text-slate-200"
                            )}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
