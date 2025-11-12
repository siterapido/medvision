import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { CourseGrid } from "@/components/dashboard/course-grid"
import { LiveEventsSection } from "@/components/dashboard/live-events"
import { Button } from "@/components/ui/button"
import type { LiveEvent } from "@/lib/dashboard/events"
import { CourseOverview, formatDurationLabel, isCourseNew } from "@/lib/dashboard/overview"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [courseRecords, userCourseProgress, eventsResult, remindersResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id,title,description,thumbnail_url,difficulty,area,lessons_count,duration,duration_minutes,updated_at,published_at,is_published")
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
    supabase
      .from("user_courses")
      .select("course_id,progress")
      .eq("user_id", user.id),
    supabase
      .from("live_events")
      .select("id,title,description,thumbnail_url,start_at,duration_minutes,instructor_name,status,is_featured,created_at,updated_at")
      .order("start_at", { ascending: true })
      .limit(50),
    supabase
      .from("live_event_reminders")
      .select("event_id")
      .eq("user_id", user.id),
  ])

  const progressMap = new Map<string, number>()
  ;(userCourseProgress.data || []).forEach((entry) => {
    if (entry?.course_id) {
      progressMap.set(entry.course_id, entry.progress ?? 0)
    }
  })

  const mockCourses: CourseOverview[] = [
    {
      id: "mock-1",
      title: "Fundamentos de Implantodontia",
      description: "Aprenda os conceitos básicos e técnicas fundamentais para implantes dentários com segurança e precisão.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "8h 30min",
      durationMinutes: 510,
      lessonsCount: 24,
      difficulty: "Básico",
      category: "Implantodontia",
      progress: 0,
      isPublished: true,
      isNew: true,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      title: "Ortodontia Avançada",
      description: "Técnicas avançadas de ortodontia para casos complexos e tratamentos diferenciados.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "12h 15min",
      durationMinutes: 735,
      lessonsCount: 36,
      difficulty: "Avançado",
      category: "Ortodontia",
      progress: 35,
      isPublished: true,
      isNew: false,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      title: "Prótese Dentária Moderna",
      description: "Domine as técnicas modernas de prótese fixa e removível com materiais de última geração.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "6h 45min",
      durationMinutes: 405,
      lessonsCount: 18,
      difficulty: "Intermediário",
      category: "Prótese",
      progress: 100,
      isPublished: true,
      isNew: false,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      title: "Endodontia Clínica",
      description: "Técnicas de tratamento de canal, desde casos simples até os mais complexos.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "5h 20min",
      durationMinutes: 320,
      lessonsCount: 15,
      difficulty: "Intermediário",
      category: "Endodontia",
      progress: 60,
      isPublished: true,
      isNew: false,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-5",
      title: "Estética Dental",
      description: "Procedimentos estéticos modernos: clareamento, facetas, laminados e harmonização orofacial.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "10h",
      durationMinutes: 600,
      lessonsCount: 28,
      difficulty: "Avançado",
      category: "Estética",
      progress: 0,
      isPublished: true,
      isNew: true,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-6",
      title: "Periodontia Aplicada",
      description: "Diagnóstico e tratamento de doenças periodontais com foco em resultados clínicos comprovados.",
      thumbnail: "/placeholder.svg?height=200&width=400",
      durationLabel: "7h 15min",
      durationMinutes: 435,
      lessonsCount: 20,
      difficulty: "Intermediário",
      category: "Periodontia",
      progress: 15,
      isPublished: true,
      isNew: false,
      updatedAt: new Date().toISOString(),
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const courses: CourseOverview[] = (courseRecords.data || []).length > 0
    ? (courseRecords.data || [])
        .map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description || "Conteúdo em breve",
          thumbnail: course.thumbnail_url || "/placeholder.svg?height=200&width=400",
          durationLabel: formatDurationLabel(course.duration, course.duration_minutes),
          durationMinutes: course.duration_minutes ?? null,
          lessonsCount: course.lessons_count ?? 0,
          difficulty: course.difficulty || null,
          category: course.area || null,
          progress: progressMap.get(course.id) ?? 0,
          isPublished: course.is_published ?? false,
          isNew: isCourseNew(course.published_at ?? null),
          updatedAt: course.updated_at ?? null,
          publishedAt: course.published_at ?? null,
        }))
        .filter((course) => course.isPublished)
    : mockCourses

  const now = new Date()
  // Usar setDate para adicionar dias corretamente
  const createFutureDate = (daysAhead: number, hour: number, minute: number = 0) => {
    const date = new Date(now)
    date.setDate(date.getDate() + daysAhead)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
  }

  const mockLiveEvents: LiveEvent[] = [
    {
      id: "live-mock-1",
      title: "Técnicas Avançadas de Implante",
      description: "Demonstração ao vivo de técnicas modernas de implantodontia",
      thumbnail: "/placeholder.svg?height=200&width=400",
      startAt: createFutureDate(2, 19, 0),
      durationMinutes: 90,
      instructorName: "Dr. Carlos Silva",
      status: "scheduled" as const,
      isFeatured: true,
    },
    {
      id: "live-mock-2",
      title: "Workshop: Clareamento Dental",
      description: "Protocolos seguros e eficazes para clareamento",
      thumbnail: "/placeholder.svg?height=200&width=400",
      startAt: createFutureDate(5, 20, 0),
      durationMinutes: 60,
      instructorName: "Dra. Marina Costa",
      status: "scheduled" as const,
      isFeatured: false,
    },
    {
      id: "live-mock-3",
      title: "Endodontia: Casos Clínicos",
      description: "Análise de casos reais e discussão de soluções",
      thumbnail: "/placeholder.svg?height=200&width=400",
      startAt: createFutureDate(8, 19, 30),
      durationMinutes: 75,
      instructorName: "Dr. Roberto Santos",
      status: "scheduled" as const,
      isFeatured: false,
    },
    {
      id: "live-mock-4",
      title: "Prótese Digital: Novas Tecnologias",
      description: "Como integrar tecnologia digital no seu consultório",
      thumbnail: "/placeholder.svg?height=200&width=400",
      startAt: createFutureDate(12, 18, 0),
      durationMinutes: 120,
      instructorName: "Dr. Fernando Lima",
      status: "scheduled" as const,
      isFeatured: true,
    },
    {
      id: "live-mock-5",
      title: "Harmonização Orofacial",
      description: "Técnicas seguras e protocolos atualizados",
      thumbnail: "/placeholder.svg?height=200&width=400",
      startAt: createFutureDate(15, 20, 30),
      durationMinutes: 90,
      instructorName: "Dra. Juliana Alves",
      status: "scheduled" as const,
      isFeatured: false,
    },
  ]

  const liveEvents: LiveEvent[] = (eventsResult.data || []).length > 0
    ? (eventsResult.data || []).map((event) => {
        const status = ["scheduled", "live", "completed"].includes(event.status)
          ? (event.status as LiveEvent["status"])
          : "scheduled"
        return {
          id: event.id,
          title: event.title,
          description: event.description ?? null,
          thumbnail: event.thumbnail_url ?? null,
          startAt: event.start_at,
          durationMinutes: event.duration_minutes ?? 60,
          instructorName: event.instructor_name ?? null,
          status,
          isFeatured: event.is_featured ?? false,
        }
      })
    : mockLiveEvents

  const reminderIds = (remindersResult.data || []).map((reminder) => reminder.event_id)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-8">
      <CourseGrid courses={courses} />

      <section className="grid gap-6">
        <LiveEventsSection initialEvents={liveEvents} initialReminders={reminderIds} />
      </section>
    </div>
  )
}
