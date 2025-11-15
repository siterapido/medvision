import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CourseCarousel } from "@/components/courses/course-carousel"
import { sanitizeCourseId } from "@/lib/course/helpers"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { PlayCircle, Clock, UploadCloud } from "lucide-react"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

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
        thumbnail: course.thumbnail_url || "/placeholder.svg?height=200&width=400",
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
        ? "from-[#10b981] via-[#34d399] to-[#059669]"
        : "from-[#0891b2] via-[#06b6d4] to-[#22d3ee]"

    const isComingSoon = course.comingSoon && course.availableAt && new Date(course.availableAt) > new Date()

    let resolvedBadge = badge ?? (course.isDraft ? "Rascunho" : undefined)
    let resolvedBadgeClassName =
      badgeClassName ??
      (course.isDraft
        ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
        : "border-[#0891b2]/60 bg-[#0891b2]/10 text-[#7de3ff]")

    if (isComingSoon) {
      resolvedBadge = "Em Breve"
      resolvedBadgeClassName = "border-amber-500/50 bg-amber-500/20 text-amber-300"
    }

    const normalizedProgress = Math.min(Math.max(course.progress, 0), 100)

    const card = (
      <Card className="interactive-card group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#0891b2]/25 bg-[radial-gradient(circle_at_top,#16243f,_#0f192f_70%)] text-white shadow-[0_24px_55px_rgba(3,7,18,0.6)] transition-all duration-500 hover:-translate-y-1 hover:border-[#2399B4]/60 hover:shadow-[0_30px_70px_rgba(8,145,178,0.35)]">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2399b4,transparent_60%)] opacity-40 blur-3xl" />
        </div>
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 230px"
            className="object-cover opacity-60 mix-blend-luminosity transition duration-[1200ms] ease-out group-hover:scale-110"
            priority={false}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1629]/90 via-[#0c1f38]/70 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200">
              <span className="text-cyan-100">{getProgressLabel(course.progress)}</span>
              <span className="text-slate-300">{course.duration}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                style={{ width: `${normalizedProgress}%` }}
              />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur">
              <PlayCircle className="h-8 w-8" />
            </div>
          </div>
          {resolvedBadge && (
            <Badge
              className={`absolute top-4 left-4 flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/90 backdrop-blur ${resolvedBadgeClassName ?? ""}`}
            >
              {resolvedBadge}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-snug text-white line-clamp-2">{course.title}</h3>
            <p className="text-xs text-slate-300/90 line-clamp-2">{course.description}</p>
            {isComingSoon && course.availableAt && (
              <div className="text-xs font-medium text-amber-300">
                Disponível em: {new Date(course.availableAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
              </div>
            )}
          </div>
          {!isComingSoon && (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-200">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium tracking-wide text-cyan-100/90">
                  <PlayCircle className="h-3.5 w-3.5 text-[#06b6d4]" />
                  {course.lessons} aulas
                </span>
                {course.materials > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium tracking-wide text-cyan-100/90">
                    <UploadCloud className="h-3.5 w-3.5 text-[#06b6d4]" />
                    {course.materials} materiais
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium tracking-wide text-cyan-100/90">
                  <Clock className="h-3.5 w-3.5 text-[#06b6d4]" />
                  {course.duration}
                </span>
              </div>
            </div>
          )}
          {isComingSoon && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              Em breve
            </div>
          )}
        </div>
      </Card>
    )

    return (
      <Link
        key={course.id}
        href={`/dashboard/cursos/${course.id}`}
        className="flex-shrink-0 block w-[min(280px,82vw)] min-w-[240px]"
      >
        {card}
      </Link>
    )
  }

  return (
    <DashboardScrollArea className="!px-0 !pt-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative overflow-hidden px-4 py-6 text-white sm:px-8 lg:px-10">
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


        {/* Cursos Em Breve */}
        {cursosEmBreve.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                  ⏳ Em Breve
                </span>
              </div>
            </div>
            <CourseCarousel ariaLabel="Cursos em breve">
              {cursosEmBreve.map((course) => renderCourseCard(course))}
            </CourseCarousel>
          </section>
        )}

        {/* Novos Cursos */}
        {novoCursos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                ✨ Meus Cursos
              </span>
            </div>
            <CourseCarousel ariaLabel="Novos cursos">
              {novoCursos.map((course) =>
                renderCourseCard(course, {
                  badge: course.isDraft ? undefined : "Novo",
                  badgeClassName: course.isDraft ? undefined : "border-primary/60 bg-primary/10 text-primary",
                }),
              )}
            </CourseCarousel>
          </div>
        )}
      </div>
      </section>
    </DashboardScrollArea>
  )
}
