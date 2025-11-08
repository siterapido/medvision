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

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
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

    // Inserir aula
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        video_url: parsed.data.video_url || null,
        duration_minutes: parsed.data.duration_minutes || null,
        module_title: parsed.data.module_title,
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

    // Preparar dados para update (remover campos undefined)
    const updateData: any = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null
    if (parsed.data.video_url !== undefined) updateData.video_url = parsed.data.video_url || null
    if (parsed.data.duration_minutes !== undefined) updateData.duration_minutes = parsed.data.duration_minutes || null
    if (parsed.data.module_title !== undefined) updateData.module_title = parsed.data.module_title
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
    const lessonsToInsert = parsed.data.lessons.map((lesson) => ({
      course_id: parsed.data.course_id,
      title: lesson.title,
      description: lesson.description || null,
      video_url: lesson.video_url || null,
      duration_minutes: lesson.duration_minutes || null,
      module_title: lesson.module_title,
      order_index: lesson.order_index,
      materials: lesson.materials || [],
      available_at: lesson.available_at || null,
    }))

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
