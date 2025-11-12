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
      (course.isDraft
        ? "border-[#9ebeff] bg-white/70 text-[#5cbaff]"
        : "border-[#9ebeff] bg-white/85 text-[#5cbaff]")

    const card = (
      <Card className="light group relative flex h-full w-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#9bbfff] !bg-gradient-to-br from-[#e4f2ff] via-[#d6e8ff] to-[#c8dfff] text-[#0c4a6e] shadow-[0_25px_45px_rgba(13,60,130,0.15)] transition-all duration-500 hover:-translate-y-2 hover:border-[#1c64f2]/60 hover:shadow-[0_30px_55px_rgba(13,60,130,0.25)] sm:w-[300px]">
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#cbe3ff] via-[#b8d5ff] to-[#a5c7ff]">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 260px"
            className="object-cover transition duration-[1200ms] ease-out group-hover:scale-110 opacity-80 mix-blend-multiply"
            priority={false}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7bbaff]/60 bg-gradient-to-br from-[#87c3ff]/70 to-[#4e8ff5]/90 text-[#cfe6ff] backdrop-blur-sm shadow-xl shadow-primary/50">
              <PlayCircle className="h-8 w-8 text-[#cfe6ff]" />
            </div>
          </div>
          {resolvedBadge && (
            <Badge
              className={`absolute top-4 left-4 rounded-full border-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-lg backdrop-blur ${resolvedBadgeClassName ?? ""}`}
            >
              {resolvedBadge}
            </Badge>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#dbefff] drop-shadow-sm">
              <span>{getProgressLabel(course.progress)}</span>
              <span>{course.duration}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/60 backdrop-blur-sm">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div>
              <h3 className="text-lg font-semibold leading-tight line-clamp-2 text-[#74b7ff]">{course.title}</h3>
              <p className="mt-2 text-sm text-[#2f4db3] line-clamp-3">{course.description}</p>
            </div>
          <div className="mt-auto flex items-center gap-4 text-xs text-[#6db6ff] font-medium">
            <span className="flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5 text-[#8dc3ff]" />
              {course.lessons} aulas
            </span>
            {course.materials > 0 && (
              <span className="flex items-center gap-1">
                <UploadCloud className="h-3.5 w-3.5 text-[#8dc3ff]" />
                {course.materials} materiais
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#8dc3ff]" />
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

        {!hasRealCourses && (
          <div className="rounded-2xl border border-slate-600/40 bg-slate-800/90 px-6 py-4 text-center text-sm text-slate-200 backdrop-blur">
            <p className="max-w-xl mx-auto">
              Ainda não há cursos cadastrados. Acesse o painel de administração para registrar o primeiro curso e ele aparecerá aqui.
            </p>
            <Link
              href="/admin/cursos"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-primary/30 bg-[linear-gradient(135deg,#0891b2_0%,#06b6d4_100%)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:shadow-xl hover:shadow-primary/30 active:scale-95"
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
