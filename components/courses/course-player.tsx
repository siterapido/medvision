"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
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

const resourceTypeConfig: Record<CourseResourceType, { label: string; icon: LucideIcon; accent: string }> = {
  pdf: { label: "PDF", icon: FileText, accent: "text-[#fbbf24]" },
  slides: { label: "Slides", icon: FolderDown, accent: "text-[#38bdf8]" },
  checklist: { label: "Checklist", icon: ClipboardList, accent: "text-[#8be7fd]" },
  template: { label: "Template", icon: BookMarked, accent: "text-[#fed7aa]" },
  video: { label: "Vídeo extra", icon: Video, accent: "text-[#f87171]" },
  link: { label: "Link externo", icon: Link2, accent: "text-[#34d399]" },
  outro: { label: "Outro", icon: ShieldCheck, accent: "text-[#c084fc]" },
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

const formatUpdatedLabel = (value?: string | null) => {
  if (!value) return "Atualizado recentemente"
  try {
    return new Date(value).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
  } catch {
    return "Atualizado recentemente"
  }
}

const formatAvailableAtLabel = (value?: string | null) => {
  if (!value) return null
  try {
    const date = new Date(value)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return null
  }
}

const isComingSoon = (course: CoursePlayerCourse) => {
  if (!course.coming_soon) return false
  if (!course.available_at) return true
  return new Date(course.available_at) > new Date()
}

const getLessonProgressLabel = (progress: number) => {
  if (progress >= 100) return "Trilha concluída"
  if (progress <= 0) return "Pronto para iniciar"
  return `${progress}% concluído`
}

const extractUrlFromString = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null

  const matches = trimmed.match(/https?:\/\/[^\s"']+/g)
  if (matches && matches.length > 0) {
    return matches[0]
  }

  return trimmed
}

const trimDuplicateProtocol = (value: string) => {
  const protocols = ["https://", "http://"]
  let secondIndex = -1
  const baseIndex = Math.min(
    ...protocols
      .map((proto) => value.indexOf(proto))
      .filter((idx) => idx !== -1),
  )

  if (baseIndex === Infinity || baseIndex === -1) {
    return value
  }

  protocols.forEach((proto) => {
    const nextIndex = value.indexOf(proto, baseIndex + proto.length)
    if (nextIndex > -1) {
      secondIndex = secondIndex === -1 ? nextIndex : Math.min(secondIndex, nextIndex)
    }
  })

  if (secondIndex > -1) {
    return value.slice(0, secondIndex)
  }

  return value
}

const normalizeVideoUrl = (value?: string | null): string | null => {
  const urlCandidate = extractUrlFromString(value)
  if (!urlCandidate) return null

  const sanitizedUrl = trimDuplicateProtocol(urlCandidate)

  try {
    const parsed = new URL(sanitizedUrl)
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase()

    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "")
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      const videoId = parsed.searchParams.get("v")
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }

    if (hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop()
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`
      }
    }

    return urlCandidate
  } catch {
    return urlCandidate
  }
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
  progress = 0,
}: {
  course: CoursePlayerCourse
  progress?: number
}) {
  const normalizedLessons = useMemo<CoursePlayerLessonState[]>(() => {
    const seenLessonIds = new Set<string>()
    const uniqueLessons: CoursePlayerLesson[] = []
    ;(course.lessons ?? []).forEach((lesson) => {
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
  const [currentLessonId, setCurrentLessonId] = useState(normalizedLessons[0]?.id ?? "")

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
  const upcomingLesson =
    lessons.find((lesson, index) => index > currentLessonIndex && !lesson.completed) ?? null

  const normalizedVideoUrl = normalizeVideoUrl(currentLesson?.video_url)

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
      setCurrentLessonId(lessons[currentIndex + 1].id)
    }

    if (course.id && currentLesson.id) {
      void persistLessonCompletion(course.id, currentLesson.id)
    }
  }

  const handleDocumentAction = (resource: LessonMaterial, action: "view" | "download") => {
    if (typeof window === "undefined") return

    if (action === "view") {
      window.open(resource.url, "_blank", "noopener,noreferrer")
      return
    }

    const link = document.createElement("a")
    link.href = resource.url
    link.download = resource.title
    link.target = "_blank"
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const courseDurationLabel = formatMinutesLabel(course.duration_minutes)
  const updatedLabel = formatUpdatedLabel(course.updated_at)
  const summaryBadge = course.area ?? course.difficulty
  const hasLessons = lessons.length > 0
  const comingSoon = isComingSoon(course)
  const availableAtLabel = formatAvailableAtLabel(course.available_at)

  if (comingSoon) {
    return (
      <section className="space-y-8 rounded-[28px] border border-white/5 bg-[#0b1424] px-4 py-6 text-white shadow-[0_25px_60px_rgba(3,6,15,0.45)] sm:px-8 sm:py-8">
        <header className="border-b border-white/5 pb-5">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Academia Odonto GPT</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-white md:text-3xl">{course.title}</h1>
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-300 border border-amber-500/30">
                  Em Breve
                </span>
              </div>
              <p className="text-sm text-slate-300">{course.description || "Descrição em breve."}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                {summaryBadge && (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.35em] text-white/70">
                    {summaryBadge}
                  </span>
                )}
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {course.difficulty ?? "Nível"}
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">{courseDurationLabel}</span>
              </div>
              {course.tags && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  {course.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.3em] text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 px-6 py-16 text-center">
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-white">Em Breve</h2>
              <p className="text-base text-slate-300">
                Este curso estará disponível em <span className="font-semibold text-amber-300">{availableAtLabel}</span>
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-200">
                Fique atento! Em breve você terá acesso a este conteúdo exclusivo e poderá iniciar sua jornada de aprendizado.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-amber-500/50 text-amber-300 hover:bg-amber-500/10 mx-auto"
            >
              Notifique-me quando disponível
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8 rounded-[28px] border border-white/5 bg-[#0b1424] px-4 py-6 text-white shadow-[0_25px_60px_rgba(3,6,15,0.45)] sm:px-8 sm:py-8">
      <header className="border-b border-white/5 pb-5">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Academia Odonto GPT</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">{course.title}</h1>
            <p className="text-sm text-slate-300">{course.description || "Descrição em breve."}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
              {summaryBadge && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.35em] text-white/70">
                  {summaryBadge}
                </span>
              )}
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                {course.difficulty ?? "Nível"}
              </span>
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">{courseDurationLabel}</span>
            </div>
            {course.tags && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                {course.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.3em] text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-right text-sm text-slate-300">
            <div>
              <p className="text-3xl font-semibold text-white">{progressValue}%</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">{getLessonProgressLabel(progressValue)}</p>
            </div>
            <p>
              {(lessons.length || course.lessons_count || 0).toString()} aulas • {courseDurationLabel}
            </p>
            <p className="text-xs text-white/50">Atualizado {updatedLabel}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-black">
            <div className="aspect-video w-full">
              {hasLessons && normalizedVideoUrl ? (
                <iframe
                  src={normalizedVideoUrl}
                  title={currentLesson?.title ?? "Vídeo do curso"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">
                  Nenhuma aula com vídeo disponível.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            {currentLesson ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
                  <span>
                    Aula {currentLessonIndex + 1} de {lessons.length || course.lessons_count || 0}
                  </span>
                  {currentLesson.duration_minutes != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatMinutesLabel(currentLesson.duration_minutes)}
                    </span>
                  )}
                  {currentLesson.module_title && <span>{currentLesson.module_title}</span>}
                  {currentLesson.available_at && (
                    <span>
                      Disponível {new Date(currentLesson.available_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-white">{currentLesson.title}</h2>
                <p className="text-sm text-slate-200">{currentLesson.description || "Sem descrição adicional."}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {!currentLesson.completed ? (
                    <Button
                      size="sm"
                      className="rounded-full bg-white text-[#0b1424] hover:bg-slate-100"
                      onClick={handleMarkComplete}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como concluída
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-white/20 text-white hover:bg-white/10"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Reassistir aula
                    </Button>
                  )}
                  {allCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-slate-200 hover:bg-white/10"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Gerar certificado
                    </Button>
                  )}
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/40">
                  Próxima: {upcomingLesson ? upcomingLesson.title : "Trilha concluída"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Nenhuma aula publicada ainda para este curso.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Materiais da aula</h3>
                <p className="text-xs text-slate-300">Disponíveis para a equipe</p>
              </div>
              <span className="text-xs text-white/50">
                {currentLesson?.materials?.length ?? 0} arquivos
              </span>
            </div>

            {currentLesson?.materials && currentLesson.materials.length > 0 ? (
              <div className="mt-4 space-y-3">
                {currentLesson.materials.map((resource, index) => {
                  const config = resourceTypeConfig[resource.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={`${resource.title}-${index}`}
                      className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#111b2f] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Icon className={cn("h-4 w-4", config.accent)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-white">{resource.title}</p>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {resource.description || "Sem descrição"}
                        </p>
                        <p className="text-xs text-white/40">{config.label}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-white/70 hover:bg-white/10"
                          onClick={() => handleDocumentAction(resource, "view")}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-white/70 hover:bg-white/10"
                          onClick={() => handleDocumentAction(resource, "download")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-300">Nenhum material anexado para esta aula.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Arquivos da aula</h3>
                <p className="text-xs text-slate-300">Anexos com acesso seguro</p>
              </div>
              <span className="text-xs text-white/50">{attachments.length} arquivos</span>
            </div>
            {attachments.length > 0 ? (
              <div className="mt-4 space-y-3">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111b2f] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      {(() => {
                        const kind = kindFromMime(att.mime_type)
                        const cls = "h-4 w-4"
                        switch (kind) {
                          case "pdf":
                            return <FileText className={cls} />
                          case "doc":
                            return <FileType className={cls} />
                          case "ppt":
                            return <FileText className={cls} />
                          case "xls":
                            return <FileSpreadsheet className={cls} />
                          case "image":
                            return <ImageIcon className={cls} />
                          case "zip":
                            return <FileArchive className={cls} />
                          default:
                            return <FileText className={cls} />
                        }
                      })()}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-white">{att.file_name}</p>
                      <p className="text-xs text-slate-300">{(att.size_bytes / (1024 * 1024)).toFixed(1)} MB • {new Date(att.created_at).toLocaleDateString("pt-BR")}</p>
                      <p className="text-xs text-white/40">{att.mime_type}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-white/70 hover:bg-white/10"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/lessons/${currentLesson?.id}/attachments/${att.id}/download`)
                            const json = await res.json().catch(() => ({}))
                            const url = json.url
                            if (typeof url === "string") {
                              const a = document.createElement("a")
                              a.href = url
                              a.rel = "noopener"
                              a.target = "_blank"
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                            }
                          } catch {}
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-300">Nenhum arquivo anexado para esta aula.</p>
            )}
          </div>
        </div>

        <aside className="w-full space-y-4 rounded-2xl border border-white/10 bg-[#0d172a] p-4 lg:max-w-sm">
          <div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Trilha do curso</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="mt-2 h-1.5 rounded-full bg-white/10" />
            <p className="mt-1 text-xs text-white/40">
              {completedCount}/{lessons.length || course.lessons_count || 0} aulas concluídas
            </p>
          </div>

          <ScrollArea className="h-[65vh] pr-2">
            <div className="space-y-2">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonId(lesson.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      lesson.id === currentLesson?.id
                        ? "border-white/20 bg-white/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          lesson.completed
                            ? "bg-white/10 text-emerald-300"
                            : lesson.id === currentLesson?.id
                              ? "bg-white text-[#0b1424]"
                              : "bg-white/5 text-white/70",
                        )}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white line-clamp-2">{lesson.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {lesson.duration_minutes != null && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatMinutesLabel(lesson.duration_minutes)}
                            </span>
                          )}
                          {lesson.module_title && <span>{lesson.module_title}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  Nenhuma aula cadastrada no momento.
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </section>
  )
}
