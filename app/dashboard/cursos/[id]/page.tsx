import Link from "next/link"

import { CoursePlayer, type CoursePlayerCourse, type CoursePlayerLesson, type LessonMaterial } from "@/components/courses/course-player"
import { createClient } from "@/lib/supabase/server"
import { sanitizeCourseId } from "@/lib/course/helpers"

const COURSE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const extractCourseId = (value?: string | null): string | null => {
  const sanitized = sanitizeCourseId(value)
  if (!sanitized) {
    return null
  }

  return COURSE_UUID_REGEX.test(sanitized) ? sanitized : null
}

export default async function CoursePage({ params }: { params: Promise<{ id?: string }> }) {
  const resolvedParams = await params
  const rawCourseId = resolvedParams?.id ?? null
  const courseId = extractCourseId(rawCourseId)

  if (!courseId) {
    const providedId = (rawCourseId ?? "").trim() || "indefinido"
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-300">
          Não foi possível carregar este curso. Verifique se o link está correto e tente novamente.
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400/70">
          ID informado: <span className="font-mono text-slate-200">{providedId}</span>
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

  const { data: courseData, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      lessons_count,
      duration_minutes,
      difficulty,
      area,
      tags,
      updated_at,
      coming_soon,
      available_at,
      lessons (
        id,
        title,
        description,
        module_title,
        video_url,
        duration_minutes,
        available_at,
        order_index
      )
    `)
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar curso:", error)
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-300">
          Não foi possível carregar o curso no momento. ({error.message})
        </p>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-300">Curso não encontrado.</p>
      </div>
    )
  }

  const { data: userProgress } = await supabase
    .from("user_courses")
    .select("progress")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: courseResources, error: resourcesError } = await supabase
    .from("course_resources")
    .select("lesson_id, title, description, resource_type, url, is_downloadable")
    .eq("course_id", courseId)

  if (resourcesError) {
    console.warn("Erro ao buscar materiais do curso:", resourcesError)
  }

  const resourcesByLesson = new Map<string, LessonMaterial[]>()
  courseResources?.forEach((resource) => {
    if (!resource.lesson_id) return
    const lessonMaterials = resourcesByLesson.get(resource.lesson_id) ?? []
    lessonMaterials.push({
      title: resource.title,
      description: resource.description ?? null,
      type: (resource.resource_type as LessonMaterial["type"]) ?? "outro",
      url: resource.url,
      is_downloadable: resource.is_downloadable ?? null,
    })
    resourcesByLesson.set(resource.lesson_id, lessonMaterials)
  })

  const normalizedLessons: CoursePlayerLesson[] = (courseData.lessons ?? []).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    module_title: lesson.module_title,
    video_url: lesson.video_url,
    duration_minutes: lesson.duration_minutes,
    materials: resourcesByLesson.get(lesson.id) ?? [],
    available_at: lesson.available_at,
    order_index: lesson.order_index ?? null,
  }))

  const course: CoursePlayerCourse = {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description,
    thumbnail_url: courseData.thumbnail_url,
    lessons_count: courseData.lessons_count,
    duration_minutes: courseData.duration_minutes,
    difficulty: courseData.difficulty,
    area: courseData.area,
    tags: courseData.tags,
    updated_at: courseData.updated_at,
    coming_soon: courseData.coming_soon,
    available_at: courseData.available_at,
    lessons: normalizedLessons,
  }

  return <CoursePlayer key={course.id} course={course} progress={userProgress?.progress ?? 0} />
}
