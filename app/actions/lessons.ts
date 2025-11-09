"use server"

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
  type ModuleFormData,
  type ModuleUpdateData,
} from "@/lib/validations/module"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

const DEFAULT_MODULE_TITLE = "Sem módulo"

const DUPLICATE_MODULE_ERROR_CODES = new Set(["PGRST116", "23505"])

async function resolveModuleReference(
  supabase: ReturnType<typeof createClient>,
  courseId: string,
  moduleId: string | undefined,
  moduleTitle: string | undefined
): Promise<{ id: string | null; title: string }> {
  const normalizedTitle = moduleTitle?.trim() || DEFAULT_MODULE_TITLE

  if (moduleId) {
    const { data, error } = await supabase
      .from("lesson_modules")
      .select("id, title")
      .eq("id", moduleId)
      .maybeSingle()

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
    const resolvedModule = await resolveModuleReference(
      supabase,
      courseId,
      parsed.data.module_id,
      parsed.data.module_title
    )

    if (!resolvedModule.id) {
      return {
        success: false,
        error: "Não foi possível associar o módulo",
      }
    }

    // Inserir aula
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        video_url: parsed.data.video_url || null,
        duration_minutes: parsed.data.duration_minutes || null,
        module_title: resolvedModule.title,
        module_id: resolvedModule.id,
        order_index: parsed.data.order_index,
        materials: parsed.data.materials || [],
        available_at: parsed.data.available_at || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar aula:", error)
      return {
        success: false,
        error: "Erro ao criar aula. Tente novamente.",
      }
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

    let resolvedModule: { id: string | null; title: string } | null = null
    if (parsed.data.module_title !== undefined || parsed.data.module_id !== undefined) {
      resolvedModule = await resolveModuleReference(
        supabase,
        lesson.course_id,
        parsed.data.module_id,
        parsed.data.module_title
      )

      if (!resolvedModule.id) {
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
      updateData.module_id = resolvedModule.id
    }
    if (parsed.data.order_index !== undefined) updateData.order_index = parsed.data.order_index
    if (parsed.data.materials !== undefined) updateData.materials = parsed.data.materials || []
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
    const lessonsToInsert: any[] = []
    for (const lesson of parsed.data.lessons) {
      const resolvedModule = await resolveModuleReference(
        supabase,
        parsed.data.course_id,
        lesson.module_id,
        lesson.module_title
      )

      if (!resolvedModule.id) {
        return {
          success: false,
          error: "Não foi possível associar o módulo em uma das aulas",
        }
      }

      lessonsToInsert.push({
        course_id: parsed.data.course_id,
        title: lesson.title,
        description: lesson.description || null,
        video_url: lesson.video_url || null,
        duration_minutes: lesson.duration_minutes || null,
        module_title: resolvedModule.title,
        module_id: resolvedModule.id,
        order_index: lesson.order_index,
        materials: lesson.materials || [],
        available_at: lesson.available_at || null,
      })
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

    const { data, error } = await supabase
      .from("lesson_modules")
      .insert({
        course_id: parsed.data.course_id,
        title: parsed.data.title.trim(),
        description: parsed.data.description || null,
        order_index: parsed.data.order_index ?? 0,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar módulo:", error)

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

    const { data: module, error: moduleError } = await supabase
      .from("lesson_modules")
      .select("id, course_id")
      .eq("id", parsed.data.id)
      .single()

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

    if (Object.keys(updatePayload).length === 0) {
      return { success: true }
    }

    const { error: updateError } = await supabase
      .from("lesson_modules")
      .update(updatePayload)
      .eq("id", module.id)

    if (updateError) {
      console.error("Erro ao atualizar módulo:", updateError)
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

    const { data: module, error: moduleError } = await supabase
      .from("lesson_modules")
      .select("id, course_id, title")
      .eq("id", moduleId)
      .single()

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
