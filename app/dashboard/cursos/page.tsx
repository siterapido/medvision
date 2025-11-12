import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CourseCarousel } from "@/components/courses/course-carousel"
import { sanitizeCourseId } from "@/lib/course/helpers"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { PlayCircle, Clock } from "lucide-react"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

type CourseWithProgress = {
  id: string
  title: string
  description: string
  thumbnail: string
  progress: number
  lessons: number
  duration: string
  isDraft: boolean
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
      is_published
    `)
    .order("created_at", { ascending: false })

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
        duration: formatDurationLabel(course.duration, course.duration_minutes),
        isDraft: course.is_published !== true,
      })

      return acc
    }, []) ?? []

  const dedupedCourses = Array.from(new Map(courses.map((course) => [course.id, course])).values())

  const hasRealCourses = dedupedCourses.length > 0

  // Apenas novos cursos (não iniciados)
  const novoCursos = dedupedCourses

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

    const resolvedBadge = badge ?? (course.isDraft ? "Rascunho" : undefined)
    const resolvedBadgeClassName =
      badgeClassName ??
      (course.isDraft ? "border-amber-400/70 bg-amber-400/10 text-amber-100" : undefined)

    const card = (
      <Card className="group relative flex h-full w-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#0891b2]/20 bg-[#16243F] text-[#E6EDF7] transition-all duration-500 hover:-translate-y-2 hover:border-[#2399B4]/60 sm:w-[300px]">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 260px"
            className="object-cover transition duration-[1200ms] ease-out group-hover:scale-110"
            priority={false}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1627] via-[#0F192F]/80 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl">
              <PlayCircle className="h-8 w-8" />
            </div>
          </div>
          {resolvedBadge && (
            <Badge
              className={`absolute top-4 left-4 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-lg backdrop-blur ${resolvedBadgeClassName ?? ""}`}
            >
              {resolvedBadge}
            </Badge>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-200">
              <span>{getProgressLabel(course.progress)}</span>
              <span>{course.duration}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h3 className="text-lg font-semibold leading-tight line-clamp-2 text-white">{course.title}</h3>
            <p className="mt-2 text-sm text-slate-200/80 line-clamp-3">{course.description}</p>
          </div>
          <div className="mt-auto flex items-center gap-4 text-xs text-slate-200/80">
            <span className="flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {course.lessons} aulas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}
            </span>
          </div>
        </div>
      </Card>
    )

    return (
      <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0">
        {card}
      </Link>
    )
  }

  return (
    <DashboardScrollArea>
      <section className="relative overflow-hidden rounded-[32px] border border-[#24324F] bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] px-4 py-6 text-white sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(35,153,180,0.25)_0%,_transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-4 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(8,145,178,0.18)_0%,_transparent_70%)] blur-3xl" />
      <div className="relative space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white">
            Hub IA + Educação
          </span>
          <div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">Meus Cursos</h1>
          </div>
        </div>

        {!hasRealCourses && (
          <div className="rounded-2xl border border-[#24324F] bg-[#16243F]/70 px-6 py-4 text-center text-sm text-slate-300 backdrop-blur">
            <p className="max-w-xl mx-auto">
              Ainda não há cursos cadastrados. Acesse o painel de administração para registrar o primeiro curso e ele aparecerá aqui.
            </p>
            <Link
              href="/admin/cursos"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-cyan-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-cyan-500"
            >
              Ir para Administração de Cursos
            </Link>
          </div>
        )}

        {/* Novos Cursos */}
        {novoCursos.length > 0 && (
          <div className="space-y-4">
            <CourseCarousel ariaLabel="Novos cursos">
              {novoCursos.map((course) =>
                renderCourseCard(course, {
                  badge: course.isDraft ? undefined : "Novo",
                  badgeClassName: course.isDraft ? undefined : "border-[#0891b2]/40 bg-[#0891b2]/15 text-[#06b6d4]",
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
