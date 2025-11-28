import Link from "next/link"

import { CoursePlayer, type CoursePlayerCourse, type CoursePlayerLesson, type LessonMaterial, type CoursePlayerModule } from "@/components/courses/course-player"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { createClient } from "@/lib/supabase/server"
import { sanitizeCourseId } from "@/lib/course/helpers"
import { getLessonModuleSupport, isLessonModulesTableMissingError, isLessonsModuleIdColumnMissingError } from "@/lib/lesson-module-support"

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
        <p className="text-sm text-slate-200">
          Não foi possível carregar este curso. Verifique se o link está correto e tente novamente.
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-200">
          ID informado: <span className="font-mono text-white">{providedId}</span>
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
      available_at
    `)
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar curso:", error)
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-200">
          Não foi possível carregar o curso no momento. ({error.message})
        </p>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-200">Curso não encontrado.</p>
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

  const moduleSupport = await getLessonModuleSupport(supabase)

  let modules: CoursePlayerModule[] = []
  let lessonsRaw: Array<any> = []

  if (moduleSupport.lessonModulesTable) {
    const { data: modulesData, error: modulesError } = await supabase
      .from("lesson_modules")
      .select("id, title, description, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    if (!modulesError && modulesData) {
      modules = modulesData.map((m) => ({ id: m.id, title: m.title, description: m.description, order_index: m.order_index }))
    } else if (modulesError && isLessonModulesTableMissingError(modulesError)) {
      modules = []
    }
  }

  const buildLessonSelectFields = (includeModuleId: boolean) => [
    "id",
    "title",
    "description",
    "video_url",
    "module_title",
    ...(includeModuleId ? ["module_id"] : []),
    "duration_minutes",
    "available_at",
    "order_index",
  ].join(", ")

  let includeModuleId = moduleSupport.lessonsModuleIdColumn && moduleSupport.lessonModulesTable
  let lessonSelectFields = buildLessonSelectFields(includeModuleId)
  let lessonsResult = await supabase
    .from("lessons")
    .select(lessonSelectFields)
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  if (lessonsResult.error && isLessonsModuleIdColumnMissingError(lessonsResult.error)) {
    includeModuleId = false
    lessonSelectFields = buildLessonSelectFields(includeModuleId)
    lessonsResult = await supabase
      .from("lessons")
      .select(lessonSelectFields)
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })
  }

  lessonsRaw = lessonsResult.data ?? []

  const normalizedLessons: CoursePlayerLesson[] = lessonsRaw.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    module_title: lesson.module_title ?? (lesson.module_id ? modules.find((m) => m.id === lesson.module_id)?.title ?? null : null),
    module_id: includeModuleId ? (lesson.module_id ?? null) : null,
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

  return (
    <DashboardScrollArea className="!px-0 !pt-0">
      <CoursePlayer key={course.id} course={course} modules={modules} progress={userProgress?.progress ?? 0} />
    </DashboardScrollArea>
  )
}
