import { Suspense } from "react"
import type { PostgrestError } from "@supabase/postgrest-js"
import { createClient } from "@/lib/supabase/server"
import { LessonManager } from "@/components/admin/lesson-manager"
import {
  LESSON_MODULE_SUPPORT_ERROR,
  getLessonModuleSupport,
  isLessonModulesTableMissingError,
  isLessonsModuleIdColumnMissingError,
} from "@/lib/lesson-module-support"
import type { LessonMaterialData } from "@/lib/validations/lesson"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Gerenciar Aulas | Admin",
  description: "Gerenciar aulas de um curso",
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type LessonModuleRecord = {
  id: string
  title: string
  description: string | null
  order_index: number | null
  created_at: string | null
  access_type: "free" | "premium" | null
}

async function normalizeModuleOrder(
  supabase: SupabaseServerClient,
  courseId: string,
  modules: LessonModuleRecord[]
): Promise<LessonModuleRecord[]> {
  if (modules.length === 0) return modules

  const getOrderValue = (module: LessonModuleRecord) =>
    module.order_index ?? Number.MAX_SAFE_INTEGER
  const getCreatedAtValue = (module: LessonModuleRecord) =>
    module.created_at ? new Date(module.created_at).getTime() : 0

  const sortedModules = [...modules].sort((a, b) => {
    const orderDiff = getOrderValue(a) - getOrderValue(b)
    if (orderDiff !== 0) return orderDiff
    return getCreatedAtValue(a) - getCreatedAtValue(b)
  })

  const updates = sortedModules.reduce<{ id: string; order_index: number }[]>(
    (payload, module, index) => {
      const desiredOrder = index
      if (getOrderValue(module) !== desiredOrder) {
        payload.push({ id: module.id, order_index: desiredOrder })
      }
      return payload
    },
    []
  )

  if (updates.length === 0) {
    return sortedModules.map((module, index) => ({
      ...module,
      order_index: index,
    }))
  }

  const updateResults = await Promise.all(
    updates.map((update) =>
      supabase
        .from("lesson_modules")
        .update({ order_index: update.order_index })
        .eq("id", update.id)
        .eq("course_id", courseId)
    )
  )

  const hasError = updateResults.some((result) => result.error)
  if (hasError) {
    console.error("Erro ao normalizar ordem dos módulos:", updateResults.find((result) => result.error)?.error)
    return sortedModules
  }

  return sortedModules.map((module, index) => ({
    ...module,
    order_index: index,
  }))
}

async function LessonsContent({ courseId }: { courseId: string }) {
  const supabase = await createClient()

  // Buscar informações do curso
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, lessons_count")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    console.error("Erro ao buscar curso:", courseError)
    notFound()
  }

  const moduleSupport = await getLessonModuleSupport(supabase)
  let modulesEnabled = moduleSupport.lessonModulesTable
  let moduleIdEnabled = moduleSupport.lessonsModuleIdColumn && modulesEnabled

  let modulesResult: {
    data: LessonModuleRecord[] | null
    error: PostgrestError | null
  } = { data: [], error: null }

  if (modulesEnabled) {
    modulesResult = await supabase
      .from("lesson_modules")
      .select("id, title, description, order_index, created_at, access_type")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    if (modulesResult.error) {
      console.error("Erro ao buscar módulos:", modulesResult.error)

      if (isLessonModulesTableMissingError(modulesResult.error)) {
        modulesEnabled = false
        moduleIdEnabled = false
        modulesResult = { data: [], error: null }
      }
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
    "order_index",
    "materials",
    "available_at",
  ].join(", ")

  let includeModuleId = moduleIdEnabled
  let lessonSelectFields = buildLessonSelectFields(includeModuleId)
  let lessonsResult = await supabase
    .from("lessons")
    .select(lessonSelectFields)
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  if (lessonsResult.error) {
    console.error("Erro ao buscar aulas:", lessonsResult.error)

    if (isLessonsModuleIdColumnMissingError(lessonsResult.error)) {
      includeModuleId = false
      lessonSelectFields = buildLessonSelectFields(includeModuleId)
      lessonsResult = await supabase
        .from("lessons")
        .select(lessonSelectFields)
        .eq("course_id", courseId)
        .order("order_index", { ascending: true })

      if (lessonsResult.error) {
        console.error("Erro ao buscar aulas sem module_id:", lessonsResult.error)
      }
    }
  }

  const lessons = lessonsResult.data || []
  const modulesFromDb = modulesResult.data || []
  const normalizedModulesBase = modulesEnabled
    ? await normalizeModuleOrder(supabase, courseId, modulesFromDb)
    : modulesFromDb
  const normalizedModules = normalizedModulesBase.map((module) => ({
    ...module,
    access_type: module.access_type ?? "free",
  }))

  const { data: courseResources } = await supabase
    .from("course_resources")
    .select("lesson_id, title, description, resource_type, url, position")
    .eq("course_id", courseId)

  const materialsByLesson = new Map<string, LessonMaterialData[]>()

  courseResources
    ?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((resource) => {
      if (!resource.lesson_id) return
      const current = materialsByLesson.get(resource.lesson_id) ?? []
      current.push({
        title: resource.title,
        description: resource.description ?? undefined,
        type: (resource.resource_type as LessonMaterialData["type"]) ?? "outro",
        url: resource.url ?? "",
      })
      materialsByLesson.set(resource.lesson_id, current)
    })

  const lessonsWithMaterials = lessons.map((lesson) => {
    const lessonMaterials = Array.isArray(lesson.materials) ? lesson.materials : []
    const materials = materialsByLesson.get(lesson.id) ?? lessonMaterials
    return {
      ...lesson,
      materials,
    }
  })

  const moduleIdAvailable = includeModuleId && modulesEnabled

  const modulesWithLessons = moduleIdAvailable
    ? normalizedModules.map((module) => ({
        ...module,
        lessons: lessonsWithMaterials.filter((lesson) => lesson.module_id === module.id),
      }))
    : normalizedModules.map((module) => ({
        ...module,
        lessons: [],
      }))

  const unassignedLessons = moduleIdAvailable
    ? lessonsWithMaterials.filter((lesson) => !lesson.module_id)
    : lessonsWithMaterials

  const modulesPayload = unassignedLessons.length
    ? [
        {
          id: null,
          title: "Sem módulo",
          description: "Aulas sem módulo definido",
          order_index: -1,
          access_type: "free" as const,
          lessons: unassignedLessons,
        },
        ...modulesWithLessons,
      ]
    : modulesWithLessons

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-4">
        <Link href="/admin/cursos">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Cursos
          </Button>
        </Link>
      </div>

      {/* Gerenciador de aulas */}
      {!modulesEnabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold text-amber-200">Módulos desativados:</strong>{" "}
          {LESSON_MODULE_SUPPORT_ERROR}
        </div>
      )}
      <LessonManager
        courseId={course.id}
        courseTitle={course.title}
        modules={modulesPayload}
        modulesEnabled={modulesEnabled}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando aulas...</p>
      </div>
    </div>
  )
}

export default async function ManageLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] p-6">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<LoadingState />}>
          <LessonsContent courseId={id} />
        </Suspense>
      </div>
    </div>
  )
}
