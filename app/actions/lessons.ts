"use server"

import type { PostgrestError } from "@supabase/postgrest-js"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  lessonFormSchema,
  lessonUpdateSchema,
  bulkLessonsSchema,
  reorderLessonsSchema,
  type LessonFormData,
  type LessonUpdateData,
  type BulkLessonsData,
  type ReorderLessonsData,
} from "@/lib/validations/lesson"
import {
  moduleFormSchema,
  moduleUpdateSchema,
  reorderModulesSchema,
  type ModuleFormData,
  type ModuleUpdateData,
  type ReorderModulesData,
} from "@/lib/validations/module"
import {
  LESSON_MODULE_SUPPORT_ERROR,
  getLessonModuleSupport,
  isLessonModulesTableMissingError,
  supportsLessonModules,
  type LessonModuleSupport,
} from "@/lib/lesson-module-support"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type NormalizedLessonMaterial = {
  title: string
  type: LessonMaterialData["type"]
  url: string
  description: string | null
}

function getMissingLessonModulesTableResult<T = void>(
  error: PostgrestError | null
): ActionResult<T> | null {
  if (isLessonModulesTableMissingError(error)) {
    return {
      success: false,
      error: LESSON_MODULE_SUPPORT_ERROR,
    }
  }

  return null
}

const DEFAULT_MODULE_TITLE = "Sem módulo"

const DUPLICATE_MODULE_ERROR_CODES = new Set(["PGRST116", "23505"])

function normalizeLessonMaterials(materials?: LessonMaterialData[] | null): NormalizedLessonMaterial[] {
  if (!materials?.length) return []

  return materials.map((material) => ({
    title: material.title.trim(),
    type: material.type,
    url: material.url.trim(),
    description: material.description?.trim() || null,
  }))
}

async function syncCourseResourcesForLesson(
  supabase: SupabaseServerClient,
  courseId: string,
  lessonId: string,
  materials: NormalizedLessonMaterial[]
): Promise<ActionResult> {
  const { error: deleteError } = await supabase.from("course_resources").delete().eq("lesson_id", lessonId)

  if (deleteError) {
    console.error("Erro ao limpar materiais existentes da aula:", deleteError)
    return {
      success: false,
      error: "Falha ao atualizar materiais da aula.",
    }
  }

  if (materials.length === 0) {
    return { success: true }
  }

  const payload = materials.map((material, index) => ({
    course_id: courseId,
    lesson_id: lessonId,
    title: material.title,
    resource_type: material.type,
    description: material.description,
    url: material.url,
    position: index,
    is_downloadable: true,
  }))

  const { error: insertError } = await supabase.from("course_resources").insert(payload)

  if (insertError) {
    console.error("Erro ao sincronizar materiais da aula:", insertError)
    return {
      success: false,
      error: "Falha ao salvar materiais vinculados à aula.",
    }
  }

  return { success: true }
}

async function resolveModuleReference(
  supabase: ReturnType<typeof createClient>,
  courseId: string,
  moduleId: string | undefined,
  moduleTitle: string | undefined,
  moduleSupport?: LessonModuleSupport
): Promise<{ id: string | null; title: string }> {
  const support = moduleSupport ?? (await getLessonModuleSupport(supabase))
  const normalizedTitle = moduleTitle?.trim() || DEFAULT_MODULE_TITLE
  const fallbackReference = { id: null, title: normalizedTitle }

  if (!supportsLessonModules(support)) {
    return fallbackReference
  }

  if (moduleId) {
    const { data, error } = await supabase
      .from("lesson_modules")
      .select("id, title")
      .eq("id", moduleId)
      .maybeSingle()

    if (isLessonModulesTableMissingError(error)) {
      return fallbackReference
    }

    if (!error && data) {
      return {
        id: data.id,
        title: data.title || normalizedTitle,
      }
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("lesson_modules")
    .select("id, title")
    .eq("course_id", courseId)
    .eq("title", normalizedTitle)
    .maybeSingle()

  if (isLessonModulesTableMissingError(existingError)) {
    return fallbackReference
  }

  if (!existingError && existing) {
    return {
      id: existing.id,
      title: existing.title || normalizedTitle,
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("lesson_modules")
    .insert({
      course_id: courseId,
      title: normalizedTitle,
      order_index: 0,
    })
    .select("id, title")
    .single()

  if (isLessonModulesTableMissingError(insertError)) {
    return fallbackReference
  }

  if (insertError) {
    console.error("Erro ao criar módulo automático:", insertError)
    const { data: fallback } = await supabase
      .from("lesson_modules")
      .select("id, title")
      .eq("course_id", courseId)
      .eq("title", normalizedTitle)
      .maybeSingle()

    if (fallback) {
      return { id: fallback.id, title: fallback.title || normalizedTitle }
    }

    return {
      id: null,
      title: normalizedTitle,
    }
  }

  if (!inserted) {
    return {
      id: null,
      title: normalizedTitle,
    }
  }

  return {
    id: inserted.id,
    title: inserted.title || normalizedTitle,
  }
}

/**
 * Cria uma nova aula para um curso
 */
export async function createLesson(
  courseId: string,
  formData: LessonFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validação
    const parsed = lessonFormSchema.safeParse(formData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Verificar se o curso existe
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return {
        success: false,
        error: "Curso não encontrado",
      }
    }

    // Resolver módulo associado
    const moduleSupport = await getLessonModuleSupport(supabase)
    const resolvedModule = await resolveModuleReference(
      supabase,
      courseId,
      parsed.data.module_id,
      parsed.data.module_title,
      moduleSupport
    )

    if (supportsLessonModules(moduleSupport) && !resolvedModule.id) {
      return {
        success: false,
        error: "Não foi possível associar o módulo",
      }
    }

    const normalizedMaterials = normalizeLessonMaterials(parsed.data.materials)

    const lessonPayload: Record<string, unknown> = {
      course_id: courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      video_url: parsed.data.video_url || null,
      duration_minutes: parsed.data.duration_minutes || null,
      module_title: resolvedModule.title,
      order_index: parsed.data.order_index,
      materials: normalizedMaterials,
      available_at: parsed.data.available_at || null,
    }

    if (moduleSupport.lessonsModuleIdColumn && resolvedModule.id) {
      lessonPayload.module_id = resolvedModule.id
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert(lessonPayload)
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar aula:", error)
      return {
        success: false,
        error: "Erro ao criar aula. Tente novamente.",
      }
    }

    const syncResult = await syncCourseResourcesForLesson(supabase, courseId, data.id, normalizedMaterials)

    if (!syncResult.success) {
      await supabase.from("lessons").delete().eq("id", data.id)
      return syncResult
    }

    // Revalidar paths
    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${courseId}`)
    revalidatePath(`/admin/cursos/${courseId}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${courseId}`)

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error("Erro inesperado ao criar aula:", error)
    return {
      success: false,
      error: "Erro inesperado ao criar aula",
    }
  }
}

/**
 * Atualiza uma aula existente
 */
export async function updateLesson(
  lessonId: string,
  formData: Partial<LessonFormData>
): Promise<ActionResult> {
  try {
    // Validação
    const parsed = lessonUpdateSchema.safeParse({ ...formData, id: lessonId })
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Buscar aula para pegar o course_id
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
      .single()

    if (lessonError || !lesson) {
      return {
        success: false,
        error: "Aula não encontrada",
      }
    }

    const moduleSupport = await getLessonModuleSupport(supabase)
    const moduleFeatureReady = supportsLessonModules(moduleSupport)

    let resolvedModule: { id: string | null; title: string } | null = null
    if (parsed.data.module_title !== undefined || parsed.data.module_id !== undefined) {
      resolvedModule = await resolveModuleReference(
        supabase,
        lesson.course_id,
        parsed.data.module_id,
        parsed.data.module_title,
        moduleSupport
      )

      if (moduleFeatureReady && !resolvedModule.id) {
        return {
          success: false,
          error: "Não foi possível associar o módulo",
        }
      }
    }

    // Preparar dados para update (remover campos undefined)
    const updateData: any = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null
    if (parsed.data.video_url !== undefined) updateData.video_url = parsed.data.video_url || null
    if (parsed.data.duration_minutes !== undefined) updateData.duration_minutes = parsed.data.duration_minutes || null
    if (resolvedModule) {
      updateData.module_title = resolvedModule.title

      if (moduleSupport.lessonsModuleIdColumn && resolvedModule.id) {
        updateData.module_id = resolvedModule.id
      }
    }
    let normalizedMaterials: NormalizedLessonMaterial[] | undefined
    if (parsed.data.order_index !== undefined) updateData.order_index = parsed.data.order_index
    if (parsed.data.materials !== undefined) {
      normalizedMaterials = normalizeLessonMaterials(parsed.data.materials)
      updateData.materials = normalizedMaterials
    }
    if (parsed.data.available_at !== undefined) updateData.available_at = parsed.data.available_at || null

    // Atualizar aula
    const { error } = await supabase
      .from("lessons")
      .update(updateData)
      .eq("id", lessonId)

    if (error) {
      console.error("Erro ao atualizar aula:", error)
      return {
        success: false,
        error: "Erro ao atualizar aula. Tente novamente.",
      }
    }

    if (normalizedMaterials) {
      const syncResult = await syncCourseResourcesForLesson(
        supabase,
        lesson.course_id,
        lessonId,
        normalizedMaterials
      )

      if (!syncResult.success) {
        return syncResult
      }
    }

    // Revalidar paths
    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${lesson.course_id}`)
    revalidatePath(`/admin/cursos/${lesson.course_id}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${lesson.course_id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao atualizar aula:", error)
    return {
      success: false,
      error: "Erro inesperado ao atualizar aula",
    }
  }
}

/**
 * Deleta uma aula
 */
export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Buscar aula para pegar o course_id
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
      .single()

    if (lessonError || !lesson) {
      return {
        success: false,
        error: "Aula não encontrada",
      }
    }

    // Deletar aula
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId)

    if (error) {
      console.error("Erro ao deletar aula:", error)
      return {
        success: false,
        error: "Erro ao deletar aula. Tente novamente.",
      }
    }

    // Revalidar paths
    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${lesson.course_id}`)
    revalidatePath(`/admin/cursos/${lesson.course_id}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${lesson.course_id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao deletar aula:", error)
    return {
      success: false,
      error: "Erro inesperado ao deletar aula",
    }
  }
}

/**
 * Busca todas as aulas de um curso
 */
export async function getLessons(courseId: string): Promise<ActionResult<any[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Erro ao buscar aulas:", error)
      return {
        success: false,
        error: "Erro ao buscar aulas. Tente novamente.",
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error("Erro inesperado ao buscar aulas:", error)
    return {
      success: false,
      error: "Erro inesperado ao buscar aulas",
    }
  }
}

/**
 * Cria múltiplas aulas de uma vez (usado pelo CourseWorkspace)
 */
export async function createBulkLessons(
  bulkData: BulkLessonsData
): Promise<ActionResult<{ ids: string[] }>> {
  try {
    // Validação
    const parsed = bulkLessonsSchema.safeParse(bulkData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Verificar se o curso existe
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", parsed.data.course_id)
      .single()

    if (courseError || !course) {
      return {
        success: false,
        error: "Curso não encontrado",
      }
    }

    // Preparar dados para inserção
    const moduleSupport = await getLessonModuleSupport(supabase)
    const moduleFeatureReady = supportsLessonModules(moduleSupport)
    const lessonsToInsert: any[] = []
    const normalizedMaterialsList: NormalizedLessonMaterial[][] = []
    for (const lesson of parsed.data.lessons) {
      const resolvedModule = await resolveModuleReference(
        supabase,
        parsed.data.course_id,
        lesson.module_id,
        lesson.module_title,
        moduleSupport
      )

      if (moduleFeatureReady && !resolvedModule.id) {
        return {
          success: false,
          error: "Não foi possível associar o módulo em uma das aulas",
        }
      }

      const normalizedMaterials = normalizeLessonMaterials(lesson.materials)

      const lessonPayload: Record<string, unknown> = {
        course_id: parsed.data.course_id,
        title: lesson.title,
        description: lesson.description || null,
        video_url: lesson.video_url || null,
        duration_minutes: lesson.duration_minutes || null,
        module_title: resolvedModule.title,
        order_index: lesson.order_index,
        materials: normalizedMaterials,
        available_at: lesson.available_at || null,
      }

      if (moduleSupport.lessonsModuleIdColumn && resolvedModule.id) {
        lessonPayload.module_id = resolvedModule.id
      }

      lessonsToInsert.push(lessonPayload)
      normalizedMaterialsList.push(normalizedMaterials)
    }

    // Inserir aulas
    const { data, error } = await supabase
      .from("lessons")
      .insert(lessonsToInsert)
      .select("id")

    if (error) {
      console.error("Erro ao criar aulas em lote:", error)
      return {
        success: false,
        error: "Erro ao criar aulas. Tente novamente.",
      }
    }

    const resourcesPayload =
      data?.flatMap((row, index) => {
        const materials = normalizedMaterialsList[index] ?? []
        return materials.map((material, materialIndex) => ({
          course_id: parsed.data.course_id,
          lesson_id: row.id,
          title: material.title,
          resource_type: material.type,
          description: material.description,
          url: material.url,
          position: materialIndex,
          is_downloadable: true,
        }))
      }) ?? []

    if (resourcesPayload.length > 0) {
      const { error: resourcesError } = await supabase.from("course_resources").insert(resourcesPayload)

      if (resourcesError) {
        console.error("Erro ao salvar materiais das aulas:", resourcesError)
        if (data?.length) {
          await supabase.from("lessons").delete().in("id", data.map((d) => d.id))
        }
        return {
          success: false,
          error: "Erro ao salvar materiais vinculados às aulas.",
        }
      }
    }

    // Revalidar paths
    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${parsed.data.course_id}`)
    revalidatePath(`/admin/cursos/${parsed.data.course_id}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${parsed.data.course_id}`)

    return {
      success: true,
      data: { ids: data.map((d) => d.id) },
    }
  } catch (error) {
    console.error("Erro inesperado ao criar aulas em lote:", error)
    return {
      success: false,
      error: "Erro inesperado ao criar aulas",
    }
  }
}

/**
 * Reordena as aulas de um curso
 */
export async function reorderLessons(
  reorderData: ReorderLessonsData
): Promise<ActionResult> {
  try {
    // Validação
    const parsed = reorderLessonsSchema.safeParse(reorderData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Atualizar cada aula com sua nova ordem
    const updates = parsed.data.lesson_orders.map((item) =>
      supabase
        .from("lessons")
        .update({ order_index: item.order_index })
        .eq("id", item.id)
        .eq("course_id", parsed.data.course_id)
    )

    const results = await Promise.all(updates)

    // Verificar se algum update falhou
    const hasError = results.some((result) => result.error)
    if (hasError) {
      console.error("Erro ao reordenar aulas")
      return {
        success: false,
        error: "Erro ao reordenar aulas. Tente novamente.",
      }
    }

    // Revalidar paths
    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${parsed.data.course_id}`)
    revalidatePath(`/admin/cursos/${parsed.data.course_id}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${parsed.data.course_id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao reordenar aulas:", error)
    return {
      success: false,
      error: "Erro inesperado ao reordenar aulas",
    }
  }
}

/**
 * Reordena os módulos de um curso
 */
export async function reorderModules(
  reorderData: ReorderModulesData
): Promise<ActionResult> {
  try {
    const parsed = reorderModulesSchema.safeParse(reorderData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()
    const moduleSupport = await getLessonModuleSupport(supabase)
    if (!moduleSupport.lessonModulesTable) {
      return {
        success: false,
        error: LESSON_MODULE_SUPPORT_ERROR,
      }
    }

    const updates = parsed.data.module_orders.map((item) =>
      supabase
        .from("lesson_modules")
        .update({ order_index: item.order_index })
        .eq("id", item.id)
        .eq("course_id", parsed.data.course_id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((result) => result.error)

    if (hasError) {
      console.error("Erro ao reordenar módulos")
      return {
        success: false,
        error: "Erro ao reordenar módulos. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${parsed.data.course_id}`)
    revalidatePath(`/admin/cursos/${parsed.data.course_id}/aulas`)
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${parsed.data.course_id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao reordenar módulos:", error)
    return {
      success: false,
      error: "Erro inesperado ao reordenar módulos",
    }
  }
}

/**
 * Cria um módulo para um curso
 */
export async function createModule(
  moduleData: ModuleFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = moduleFormSchema.safeParse(moduleData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()
    const moduleSupport = await getLessonModuleSupport(supabase)
    if (!moduleSupport.lessonModulesTable) {
      return {
        success: false,
        error: LESSON_MODULE_SUPPORT_ERROR,
      }
    }

    const { data, error } = await supabase
      .from("lesson_modules")
      .insert({
        course_id: parsed.data.course_id,
        title: parsed.data.title.trim(),
        description: parsed.data.description || null,
        order_index: parsed.data.order_index ?? 0,
        access_type: parsed.data.access_type ?? "free",
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar módulo:", error)

      const missingTableResult = getMissingLessonModulesTableResult<{ id: string }>(error)
      if (missingTableResult) {
        return missingTableResult
      }

      if (error.code && DUPLICATE_MODULE_ERROR_CODES.has(error.code)) {
        return {
          success: false,
          error: "Já existe um módulo com esse nome",
          fieldErrors: {
            title: ["Já existe um módulo com esse nome"],
          },
        }
      }

      return {
        success: false,
        error: "Erro ao criar módulo. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${parsed.data.course_id}`)
    revalidatePath(`/admin/cursos/${parsed.data.course_id}/aulas`)

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error("Erro inesperado ao criar módulo:", error)
    return {
      success: false,
      error: "Erro inesperado ao criar módulo",
    }
  }
}

/**
 * Atualiza um módulo existente
 */
export async function updateModule(
  moduleData: ModuleUpdateData
): Promise<ActionResult> {
  try {
    const parsed = moduleUpdateSchema.safeParse(moduleData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()
    const moduleSupport = await getLessonModuleSupport(supabase)
    if (!moduleSupport.lessonModulesTable) {
      return {
        success: false,
        error: LESSON_MODULE_SUPPORT_ERROR,
      }
    }

    const { data: module, error: moduleError } = await supabase
      .from("lesson_modules")
      .select("id, course_id")
      .eq("id", parsed.data.id)
      .single()

    const missingModuleResult = getMissingLessonModulesTableResult(moduleError)
    if (missingModuleResult) {
      return missingModuleResult
    }

    if (moduleError || !module) {
      return {
        success: false,
        error: "Módulo não encontrado",
      }
    }

    const updatePayload: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title.trim()
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description || null
    if (parsed.data.order_index !== undefined) updatePayload.order_index = parsed.data.order_index
    if (parsed.data.access_type !== undefined) updatePayload.access_type = parsed.data.access_type

    if (Object.keys(updatePayload).length === 0) {
      return { success: true }
    }

    const { error: updateError } = await supabase
      .from("lesson_modules")
      .update(updatePayload)
      .eq("id", module.id)

    if (updateError) {
      console.error("Erro ao atualizar módulo:", updateError)
      const missingUpdateResult = getMissingLessonModulesTableResult(updateError)
      if (missingUpdateResult) {
        return missingUpdateResult
      }

      return {
        success: false,
        error: "Erro ao atualizar módulo. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${module.course_id}`)
    revalidatePath(`/admin/cursos/${module.course_id}/aulas`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao atualizar módulo:", error)
    return {
      success: false,
      error: "Erro inesperado ao atualizar módulo",
    }
  }
}

/**
 * Remove um módulo
 */
export async function deleteModule(moduleId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const moduleSupport = await getLessonModuleSupport(supabase)
    if (!moduleSupport.lessonModulesTable) {
      return {
        success: false,
        error: LESSON_MODULE_SUPPORT_ERROR,
      }
    }

    const { data: module, error: moduleError } = await supabase
      .from("lesson_modules")
      .select("id, course_id, title")
      .eq("id", moduleId)
      .single()

    const missingModuleResult = getMissingLessonModulesTableResult(moduleError)
    if (missingModuleResult) {
      return missingModuleResult
    }

    if (moduleError || !module) {
      return {
        success: false,
        error: "Módulo não encontrado",
      }
    }

    const { error } = await supabase
      .from("lesson_modules")
      .delete()
      .eq("id", moduleId)

    if (error) {
      console.error("Erro ao deletar módulo:", error)
      const missingDeleteResult = getMissingLessonModulesTableResult(error)
      if (missingDeleteResult) {
        return missingDeleteResult
      }

      return {
        success: false,
        error: "Erro ao deletar módulo. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath(`/admin/cursos/${module.course_id}`)
    revalidatePath(`/admin/cursos/${module.course_id}/aulas`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao deletar módulo:", error)
    return {
      success: false,
      error: "Erro inesperado ao deletar módulo",
    }
  }
}
