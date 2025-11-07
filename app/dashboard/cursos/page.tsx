import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CourseCarousel } from "@/components/courses/course-carousel"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PlayCircle, Clock } from "lucide-react"

type CourseWithProgress = {
  id: string
  title: string
  description: string
  thumbnail: string
  progress: number
  lessons: number
  duration: string
  isSample?: boolean
}

const sampleCourses: CourseWithProgress[] = [
  {
    id: "demo-implantodontia",
    title: "Implantodontia Guiada em 3D",
    description: "Fluxo digital completo para carga imediata com planejamento guiado e protocolos de sedação.",
    thumbnail:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 45,
    lessons: 18,
    duration: "18h 30m",
    isSample: true,
  },
  {
    id: "demo-sedacao",
    title: "Sedação Consciente e Controle de Dor",
    description: "Farmacologia aplicada, checklists de segurança e simulações de emergências clínicas.",
    thumbnail:
      "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 0,
    lessons: 22,
    duration: "14h 10m",
    isSample: true,
  },
  {
    id: "demo-odontopediatria",
    title: "Odontopediatria Humanizada",
    description: "Protocolos comportamentais, laserterapia e atendimento minimamente invasivo em crianças.",
    thumbnail:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 72,
    lessons: 16,
    duration: "9h 45m",
    isSample: true,
  },
  {
    id: "demo-dtm",
    title: "DTM e Dor Orofacial",
    description: "Diagnóstico interdisciplinar, terapias combinadas e planejamento com IA clínica.",
    thumbnail:
      "https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 100,
    lessons: 19,
    duration: "11h 20m",
    isSample: true,
  },
  {
    id: "demo-estetica",
    title: "Estética Avançada e Lentes Ultrafinas",
    description: "Workflow digital, mockups imersivos e documentação fotográfica premium.",
    thumbnail:
      "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 15,
    lessons: 14,
    duration: "8h 55m",
    isSample: true,
  },
  {
    id: "demo-urgencias",
    title: "Urgências em Odontologia",
    description: "Protocolos para traumas, antibioticoterapia e integração com IA de tomada de decisão.",
    thumbnail:
      "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=900&q=80&sat=-20",
    progress: 0,
    lessons: 12,
    duration: "6h 20m",
    isSample: true,
  },
]

export default async function CursosPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all courses
  const { data: allCourses } = await supabase.from("courses").select("*").order("created_at", { ascending: true })

  // Fetch user progress for courses
  const { data: userProgress } = await supabase.from("user_courses").select("*").eq("user_id", user.id)

  // Merge courses with user progress
  const courses: CourseWithProgress[] =
    allCourses?.map((course) => {
      const progress = userProgress?.find((p) => p.course_id === course.id)
      return {
        id: String(course.id),
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail_url || "/placeholder.svg?height=200&width=400",
        progress: progress?.progress || 0,
        lessons: course.lessons_count ?? 0,
        duration: course.duration ?? "—",
      }
    }) || []

  const hasRealCourses = courses.length > 0
  const enrichedCourses: CourseWithProgress[] =
    courses.length >= 6
      ? courses
      : [
          ...courses,
          ...sampleCourses.filter((sample) => !courses.some((realCourse) => realCourse.id === sample.id)),
        ]

  // Categorizar cursos
  const inProgress = enrichedCourses.filter((c) => c.progress > 0 && c.progress < 100)
  const notStarted = enrichedCourses.filter((c) => c.progress === 0)
  const completed = enrichedCourses.filter((c) => c.progress === 100)

  const curatedSections = [
    {
      id: "premium",
      label: "Especializações premium",
      title: "Domine procedimentos avançados",
      description: "Coleções com cirurgia guiada, sedação consciente e fluxo digital completo.",
      badge: "Premium",
      badgeClassName: "border-[#06b6d4]/60 bg-[#06b6d4]/15 text-white",
      courses: enrichedCourses.slice(0, 5),
    },
    {
      id: "express",
      label: "Trilhas intensivas",
      title: "Bootcamps clínicos de alto impacto",
      description: "Sprints com protocolos aplicáveis, checklists e materiais para a equipe.",
      badge: "Express",
      badgeClassName: "border-[#f97316]/50 bg-[#f97316]/15 text-[#fed7aa]",
      courses: enrichedCourses.slice(2, 7),
    },
  ].filter((section) => section.courses.length > 0)

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

    const resolvedBadge = badge ?? (course.isSample ? "Demo" : undefined)
    const resolvedBadgeClassName =
      badgeClassName ?? (course.isSample ? "border-white/30 bg-white/10 text-white/80" : undefined)

    const card = (
      <Card className="group relative flex h-full w-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#0891b2]/20 bg-[#16243F] text-[#E6EDF7] shadow-[0_25px_70px_rgba(8,17,35,0.55)] transition-all duration-500 hover:-translate-y-2 hover:border-[#2399B4]/60 hover:shadow-[0_40px_110px_rgba(6,18,40,0.75)] sm:w-[300px]">
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-110"
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

    if (course.isSample) {
      return (
        <div key={course.id} className="flex-shrink-0 opacity-95" aria-label={`${course.title} (demonstração)`}>
          {card}
        </div>
      )
    }

    return (
      <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0">
        {card}
      </Link>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#24324F] bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] px-4 py-6 text-white shadow-[0_40px_120px_rgba(4,10,30,0.65)] sm:px-8 lg:px-10">
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
            <p className="mt-2 max-w-2xl text-base text-slate-200">
              Continue seu aprendizado em uma experiência imersiva alinhada ao guia UI/UX: tema médico premium, tons teal
              e progressos evidentes para cada jornada.
            </p>
          </div>
        </div>

        {!hasRealCourses && (
          <div className="rounded-2xl border border-[#24324F] bg-[#16243F]/70 px-6 py-4 text-center text-sm text-slate-300 shadow-[0_20px_60px_rgba(3,8,20,0.45)] backdrop-blur">
            Mostrando catálogo demonstrativo. Execute a migration{" "}
            <code className="rounded bg-white/5 px-2 py-1 text-primary">002_courses_and_chat.sql</code> para habilitar seus
            cursos reais.
          </div>
        )}

        {/* Cursos em Progresso */}
        {inProgress.length > 0 && (
          <div className="space-y-4">
            <div className="px-1 sm:px-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
                Em andamento
              </span>
              <h2 className="text-2xl font-semibold text-white">Continue Assistindo</h2>
            </div>
            <CourseCarousel ariaLabel="Cursos em andamento" className="px-1 sm:px-2">
              {inProgress.map((course) => renderCourseCard(course))}
            </CourseCarousel>
          </div>
        )}

        {/* Cursos Novos */}
        {notStarted.length > 0 && (
          <div className="space-y-4">
            <div className="px-1 sm:px-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
                Novidades
              </span>
              <h2 className="text-2xl font-semibold text-white">Explore Novos Cursos</h2>
            </div>
            <CourseCarousel ariaLabel="Novos cursos" className="px-1 sm:px-2">
              {notStarted.map((course) =>
                renderCourseCard(course, {
                  badge: course.isSample ? "Demo" : "Novo",
                  badgeClassName: course.isSample
                    ? "border-white/30 bg-white/10 text-white/80"
                    : "border-[#0891b2]/40 bg-[#0891b2]/15 text-[#06b6d4]",
                }),
              )}
            </CourseCarousel>
          </div>
        )}

        {/* Cursos Concluídos */}
        {completed.length > 0 && (
          <div className="space-y-4">
            <div className="px-1 sm:px-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
                Missões completas
              </span>
              <h2 className="text-2xl font-semibold text-white">Cursos Concluídos</h2>
            </div>
            <CourseCarousel ariaLabel="Cursos concluídos" className="px-1 sm:px-2">
              {completed.map((course) =>
                renderCourseCard(course, {
                  badge: "Concluído",
                  badgeClassName: "border-[#10b981]/40 bg-[#10b981]/15 text-[#34d399]",
                }),
              )}
            </CourseCarousel>
          </div>
        )}

        {/* Curated Sections */}
        {curatedSections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="px-1 sm:px-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
                {section.label}
              </span>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                  <p className="text-sm text-slate-300">{section.description}</p>
                </div>
              </div>
            </div>
            <CourseCarousel ariaLabel={section.title} className="px-1 sm:px-2">
              {section.courses.map((course) =>
                renderCourseCard(course, {
                  badge: section.badge,
                  badgeClassName: section.badgeClassName,
                }),
              )}
            </CourseCarousel>
          </div>
        ))}
      </div>
    </section>
  )
}
