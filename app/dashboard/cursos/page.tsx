import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentTypeSections } from "@/components/dashboard/content-type-filter"
import { sanitizeCourseId } from "@/lib/course/helpers"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { CourseSparkline } from "@/components/dashboard/course-sparkline"
import { createClient } from "@/lib/supabase/server"
import { PlayCircle, Clock, UploadCloud } from "lucide-react"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { CourseThumbnail } from "@/components/dashboard/course-thumbnail"

type CourseWithProgress = {
  id: string
  title: string
  description: string
  thumbnail: string
  progress: number
  lessons: number
  materials: number
  duration: string
  isDraft: boolean
  comingSoon?: boolean
  availableAt?: string | null
}

type LiveItem = {
  id: string
  title: string
  description: string
  thumbnail: string
  scheduledAt: string
  status: "scheduled" | "live" | "completed"
}

const formatDurationLabel = (durationText?: string | null, durationMinutes?: number | null) => {
  if (durationText) {
    return durationText
  }

  if (durationMinutes && durationMinutes > 0) {
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    }
    if (hours > 0) {
      return `${hours}h`
    }
    return `${minutes}m`
  }

  return "—"
}

export default async function CursosPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all courses (most recent first)
  const { data: allCourses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      lessons_count,
      duration,
      duration_minutes,
      is_published,
      coming_soon,
      available_at
    `)
    .order("created_at", { ascending: false })

  const courseIds = allCourses?.map((course) => course.id).filter(Boolean) ?? []
  const materialsCountMap = new Map<string, number>()

  if (courseIds.length > 0) {
    const { data: courseMaterials, error: materialsError } = await supabase
      .from("course_resources")
      .select("course_id")
      .in("course_id", courseIds)

    if (materialsError) {
      console.error("Erro ao buscar materiais de cursos:", materialsError)
    } else {
      courseMaterials?.forEach((material) => {
        if (!material.course_id) return
        materialsCountMap.set(material.course_id, (materialsCountMap.get(material.course_id) ?? 0) + 1)
      })
    }
  }

  // Fetch user progress for courses
  const { data: userProgress } = await supabase.from("user_courses").select("*").eq("user_id", user.id)

  // Merge courses with user progress
  const courses: CourseWithProgress[] =
    allCourses?.reduce<CourseWithProgress[]>((acc, course) => {
      const id = sanitizeCourseId(course?.id ?? null)
      if (!id) {
        return acc
      }

      const progress = userProgress?.find((p) => p.course_id === course.id)
      acc.push({
        id,
        title: course.title,
        description: course.description || "Descrição em breve",
        thumbnail: course.thumbnail_url ?? "",
        progress: progress?.progress || 0,
        lessons: course.lessons_count ?? 0,
        materials: materialsCountMap.get(course.id ?? "") ?? 0,
        duration: formatDurationLabel(course.duration, course.duration_minutes),
        isDraft: course.is_published !== true,
        comingSoon: course.coming_soon || false,
        availableAt: course.available_at,
      })

      return acc
    }, []) ?? []

  const dedupedCourses = Array.from(new Map(courses.map((course) => [course.id, course])).values())

  const hasRealCourses = dedupedCourses.length > 0

  // Separar cursos em breve dos demais
  const cursosEmBreve = dedupedCourses.filter(c => c.comingSoon && c.availableAt && new Date(c.availableAt) > new Date())
  const novoCursos = dedupedCourses.filter(c => !(c.comingSoon && c.availableAt && new Date(c.availableAt) > new Date()))

  const { data: livesRaw } = await supabase
    .from("live_events")
    .select("id,title,description,thumbnail_url,start_at,status,duration_minutes")
    .order("start_at", { ascending: true })

  const livesAgendadas: LiveItem[] = (livesRaw ?? [])
    .filter((l) => l.status === "scheduled" && l.start_at && new Date(l.start_at) > new Date())
    .map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description || "Descrição em breve",
      thumbnail: l.thumbnail_url || "",
      scheduledAt: l.start_at,
      status: "scheduled",
    }))

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return "Curso concluído"
    if (progress <= 0) return "Pronto para iniciar"
    return `${progress}% em andamento`
  }

  const renderCourseCard = (
    course: CourseWithProgress,
    options: { badge?: string; badgeClassName?: string } = {},
  ) => {
    const { badge, badgeClassName } = options
    const gradientClass =
      course.progress >= 100
        ? "from-emerald-500 via-emerald-400 to-emerald-500"
        : "from-cyan-500 via-cyan-400 to-cyan-500"

    const isComingSoon = course.comingSoon && course.availableAt && new Date(course.availableAt) > new Date()

    let resolvedBadge = badge ?? (course.isDraft ? "Rascunho" : undefined)
    let resolvedBadgeClassName =
      badgeClassName ??
      (course.isDraft
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200")

    if (isComingSoon) {
      resolvedBadge = "Em Breve"
      resolvedBadgeClassName = "border-amber-500/30 bg-amber-500/10 text-amber-200"
    }

    const normalizedProgress = Math.min(Math.max(course.progress, 0), 100)

    const card = (
      <Card className="p-0 gap-0 group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/20 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-cyan-900/10">
        {/* Thumbnail Container */}
        <div className="relative w-full overflow-hidden aspect-[16/9]">
          <CourseThumbnail
            src={course.thumbnail}
            alt={course.title}
            className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
            priority={false}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 scale-90">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 hover:scale-110 hover:bg-cyan-400">
              <PlayCircle className="h-6 w-6 fill-current" />
            </div>
          </div>

          {/* Badges */}
          {resolvedBadge && (
            <div className="absolute top-3 left-3">
              <Badge
                className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${resolvedBadgeClassName ?? ""}`}
              >
                {resolvedBadge}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold leading-tight text-white line-clamp-2 group-hover:text-cyan-400 transition-colors duration-300">
              {course.title}
            </h3>

            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {course.description}
            </p>

            {isComingSoon && course.availableAt && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300/90 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                <span>Disponível em {new Date(course.availableAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
              </div>
            )}
          </div>

          {/* Footer / Meta */}
          {!isComingSoon && (
            <div className="mt-5 space-y-4">
              {/* Metadata Pills */}
              <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 border border-white/5">
                  <PlayCircle className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{course.lessons} aulas</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 border border-white/5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{course.duration}</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={course.progress >= 100 ? "text-emerald-400 font-medium" : "text-cyan-400 font-medium"}>
                    {getProgressLabel(course.progress)}
                  </span>
                  <span className="text-slate-500 font-medium">{Math.round(normalizedProgress)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${normalizedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    )

    return (
      <Link
        key={course.id}
        href={`/dashboard/cursos/${course.id}`}
        className="flex-shrink-0 block w-full sm:w-[300px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-3xl"
      >
        {card}
      </Link>
    )
  }

  const renderLiveCard = (live: LiveItem) => {
    return (
      <div
        key={live.id}
        className="flex-shrink-0 block w-full sm:w-[300px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-3xl"
      >
        <Card className="p-0 gap-0 group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/20 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-cyan-900/10">
          {/* Link invisível cobrindo todo o card */}
          <Link
            href={`/dashboard/cursos/live/${live.id}`}
            className="absolute inset-0 z-10"
            aria-label={`Ver detalhes da live: ${live.title}`}
          />

          {/* Thumbnail Container */}
          <div className="relative w-full overflow-hidden aspect-[16/9] pointer-events-none">
            <CourseThumbnail
              src={live.thumbnail}
              alt={live.title}
              className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
              priority={false}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />

            {/* Play/Action Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 scale-90">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 hover:scale-110 hover:bg-cyan-400">
                <PlayCircle className="h-6 w-6 fill-current" />
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 pointer-events-auto">
              <Badge className="rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                Live
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5 relative z-20">
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold leading-tight text-white line-clamp-2 group-hover:text-cyan-400 transition-colors duration-300">
                {live.title}
              </h3>

              <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                {live.description}
              </p>

              {live.scheduledAt && (
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-300/90 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(live.scheduledAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <DashboardScrollArea className="!px-0 !pt-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative px-4 py-6 text-white sm:px-8 lg:px-10">
        <div className="relative space-y-10">
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Hub IA + Educação
            </span>
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Meus Cursos</h1>
            </div>
          </div>


          <ContentTypeSections
            cursosEmBreveCards={cursosEmBreve.map((course) => renderCourseCard(course))}
            novoCursosCards={novoCursos.map((course) =>
              renderCourseCard(course, {
                badge: course.isDraft ? undefined : "Novo",
                badgeClassName: course.isDraft ? undefined : "border-primary/60 bg-primary/10 text-primary",
              }),
            )}
            livesAgendadasCards={livesAgendadas.map((live) => renderLiveCard(live))}
          />
        </div>
      </section>
    </DashboardScrollArea>
  )
}
