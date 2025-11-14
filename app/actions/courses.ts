"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  courseFormSchema,
  bulkActionSchema,
  type CourseFormData,
  type BulkActionData,
} from "@/lib/validations/course"
import {
  normalizeDifficulty,
  parsePrice,
  parseTags,
} from "@/lib/course/helpers"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Cria um novo curso com dados básicos
 */
export async function createCourse(
  formData: CourseFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    console.log("🚀 [createCourse] Iniciando criação de curso", {
      formDataKeys: Object.keys(formData),
      timestamp: new Date().toISOString(),
    })

    // Validação
    const parsed = courseFormSchema.safeParse(formData)
    if (!parsed.success) {
      const {
        fieldErrors: rawFieldErrors,
        formErrors,
      } = parsed.error.flatten()
      const fieldErrors = Object.fromEntries(
        Object.entries(rawFieldErrors).filter(
          ([, messages]) => messages && messages.length > 0
        )
      )
      const hasFieldErrors = Object.keys(fieldErrors).length > 0
      console.error("❌ [createCourse] Erro de validação:", {
        fieldErrors: hasFieldErrors ? fieldErrors : undefined,
        issues: parsed.error.issues.map(issue => ({
          code: issue.code,
          path: issue.path.join("."),
          message: issue.message,
        })),
      })
      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        ...(hasFieldErrors ? { fieldErrors } : {}),
      }
    }

    console.log("✅ [createCourse] Validação passou", {
      title: parsed.data.title,
      area: parsed.data.area,
      difficulty: parsed.data.difficulty,
      course_type: parsed.data.course_type,
    })

    const supabase = await createClient()

    // Inserir curso
    const normalizedLevel = normalizeDifficulty(parsed.data.difficulty)
    console.log("🔄 [createCourse] Normalizando dificuldade", {
      original: parsed.data.difficulty,
      normalized: normalizedLevel,
    })

    const parsedPrice = parsePrice(parsed.data.price)
    console.log("💰 [createCourse] Parseando preço", {
      original: parsed.data.price,
      parsed: parsedPrice,
      isValid: parsedPrice !== null,
    })

    const parsedTags = parseTags(parsed.data.tags)
    console.log("🏷️ [createCourse] Parseando tags", {
      original: parsed.data.tags,
      parsed: parsedTags,
      count: parsedTags?.length ?? 0,
    })
    const parsedDuration = parsed.data.duration ? parseInt(parsed.data.duration) : null

    const courseData = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      area: parsed.data.area,
      difficulty: normalizedLevel,
      course_type: parsed.data.course_type,
      price: parsedPrice,
      tags: parsedTags,
      duration_minutes: parsedDuration,
      thumbnail_url: parsed.data.thumbnail_url || null,
      is_published: false,
      lessons_count: 0,
      coming_soon: parsed.data.coming_soon || false,
      available_at: parsed.data.available_at || null,
    }

    console.log("📝 [createCourse] Dados prontos para inserção", {
      courseData,
      parsedPrice_isValid: parsedPrice !== null ? !isNaN(parsedPrice) : true,
    })

    const { data, error } = await supabase
      .from("courses")
      .insert(courseData)
      .select("id")
      .single()

    if (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      }

      console.error("❌ [createCourse] Erro ao inserir no banco de dados", {
        error: errorDetails,
        courseData,
        timestamp: new Date().toISOString(),
      })

      // Retornar erro mais específico baseado no tipo de erro
      let userError = "Erro ao criar curso. Tente novamente."
      if (error.message.includes("constraint")) {
        userError = `Violação de constraint: ${error.message}`
      } else if (error.message.includes("permission")) {
        userError = "Você não tem permissão para criar cursos."
      } else if (error.message.includes("not found")) {
        userError = "Recurso não encontrado."
      }

      // Log para debug
      console.error("📊 [createCourse] Detalhes completos do erro:", {
        userError,
        errorDetails,
        courseData,
      })

      return {
        success: false,
        error: userError,
      }
    }

    console.log("✅ [createCourse] Curso criado com sucesso", {
      courseId: data?.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error("❌ [createCourse] Erro inesperado", {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error: "Erro inesperado ao criar curso",
    }
  }
}

/**
 * Atualiza um curso existente
 */
export async function updateCourse(
  courseId: string,
  formData: CourseFormData
): Promise<ActionResult> {
  try {
    console.log("🚀 [updateCourse] Iniciando atualização de curso", {
      courseId,
      formDataKeys: Object.keys(formData),
      timestamp: new Date().toISOString(),
    })

    // Validação
    const parsed = courseFormSchema.safeParse(formData)
    if (!parsed.success) {
      const {
        fieldErrors: rawFieldErrors,
        formErrors,
      } = parsed.error.flatten()
      const fieldErrors = Object.fromEntries(
        Object.entries(rawFieldErrors).filter(
          ([, messages]) => messages && messages.length > 0
        )
      )
      const hasFieldErrors = Object.keys(fieldErrors).length > 0
      console.error("❌ [updateCourse] Erro de validação:", {
        courseId,
        fieldErrors: hasFieldErrors ? fieldErrors : undefined,
        issues: parsed.error.issues.map(issue => ({
          code: issue.code,
          path: issue.path.join("."),
          message: issue.message,
        })),
      })
      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        ...(hasFieldErrors ? { fieldErrors } : {}),
      }
    }

    console.log("✅ [updateCourse] Validação passou", {
      courseId,
      title: parsed.data.title,
      area: parsed.data.area,
      difficulty: parsed.data.difficulty,
    })

    const supabase = await createClient()

    // Preparar dados para atualização
    const normalizedLevel = normalizeDifficulty(parsed.data.difficulty)
    console.log("🔄 [updateCourse] Normalizando dificuldade", {
      original: parsed.data.difficulty,
      normalized: normalizedLevel,
    })

    const parsedPrice = parsePrice(parsed.data.price)
    console.log("💰 [updateCourse] Parseando preço", {
      original: parsed.data.price,
      parsed: parsedPrice,
      isValid: parsedPrice !== null,
    })

    const parsedTags = parseTags(parsed.data.tags)
    console.log("🏷️ [updateCourse] Parseando tags", {
      original: parsed.data.tags,
      parsed: parsedTags,
      count: parsedTags?.length ?? 0,
    })
    const parsedDuration = parsed.data.duration ? parseInt(parsed.data.duration) : null

    const courseData = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      area: parsed.data.area,
      difficulty: normalizedLevel,
      course_type: parsed.data.course_type,
      price: parsedPrice,
      tags: parsedTags,
      duration_minutes: parsedDuration,
      thumbnail_url: parsed.data.thumbnail_url || null,
      coming_soon: parsed.data.coming_soon || false,
      available_at: parsed.data.available_at || null,
    }

    console.log("📝 [updateCourse] Dados prontos para atualização", {
      courseId,
      courseData,
      parsedPrice_isValid: parsedPrice !== null ? !isNaN(parsedPrice) : true,
    })

    const { error } = await supabase
      .from("courses")
      .update(courseData)
      .eq("id", courseId)

    if (error) {
      console.error("❌ [updateCourse] Erro ao atualizar no banco de dados", {
        courseId,
        error: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        courseData,
        timestamp: new Date().toISOString(),
      })

      let userError = "Erro ao atualizar curso. Tente novamente."
      if (error.message.includes("constraint")) {
        userError = "Dados inválidos. Verifique se todos os campos estão corretos."
      } else if (error.message.includes("permission")) {
        userError = "Você não tem permissão para atualizar este curso."
      } else if (error.message.includes("not found")) {
        userError = "Curso não encontrado."
      }

      return {
        success: false,
        error: userError,
      }
    }

    console.log("✅ [updateCourse] Curso atualizado com sucesso", {
      courseId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${courseId}`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error("❌ [updateCourse] Erro inesperado", {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error: "Erro inesperado ao atualizar curso",
    }
  }
}

/**
 * Deleta um curso (e suas aulas em cascata)
 */
export async function deleteCourse(courseId: string): Promise<ActionResult> {
  try {
    console.log("🗑️ [deleteCourse] Iniciando exclusão de curso", {
      courseId,
      timestamp: new Date().toISOString(),
    })

    const supabase = await createClient()

    const { error } = await supabase.from("courses").delete().eq("id", courseId)

    if (error) {
      console.error("❌ [deleteCourse] Erro ao deletar curso", {
        courseId,
        error: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        error: "Erro ao deletar curso. Tente novamente.",
      }
    }

    console.log("✅ [deleteCourse] Curso deletado com sucesso", {
      courseId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ [deleteCourse] Erro inesperado", {
      courseId,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: "Erro inesperado ao deletar curso",
    }
  }
}

/**
 * Toggle do status de publicação de um curso
 */
export async function togglePublishCourse(
  courseId: string,
  currentStatus: boolean
): Promise<ActionResult> {
  try {
    const newStatus = !currentStatus
    console.log("📢 [togglePublishCourse] Iniciando toggle de publicação", {
      courseId,
      currentStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    })

    const supabase = await createClient()

    const { error } = await supabase
      .from("courses")
      .update({ is_published: newStatus })
      .eq("id", courseId)

    if (error) {
      console.error("❌ [togglePublishCourse] Erro ao alterar status de publicação", {
        courseId,
        currentStatus,
        newStatus,
        error: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        error: "Erro ao alterar status de publicação. Tente novamente.",
      }
    }

    console.log("✅ [togglePublishCourse] Status de publicação alterado com sucesso", {
      courseId,
      newStatus,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ [togglePublishCourse] Erro inesperado", {
      courseId,
      currentStatus,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: "Erro inesperado ao alterar status",
    }
  }
}

/**
 * Executa ações em lote em múltiplos cursos
 */
export async function bulkActionCourses(
  actionData: BulkActionData
): Promise<ActionResult<{ affected: number }>> {
  try {
    console.log("📦 [bulkActionCourses] Iniciando ação em lote", {
      action: actionData.action,
      courseCount: actionData.courseIds.length,
      timestamp: new Date().toISOString(),
    })

    // Validação
    const parsed = bulkActionSchema.safeParse(actionData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      console.error("❌ [bulkActionCourses] Erro de validação:", {
        fieldErrors,
        issues: parsed.error.issues.map(issue => ({
          code: issue.code,
          path: issue.path.join("."),
          message: issue.message,
        })),
      })
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors,
      }
    }

    console.log("✅ [bulkActionCourses] Validação passou", {
      action: parsed.data.action,
      courseCount: parsed.data.courseIds.length,
    })

    const { courseIds, action } = parsed.data
    const supabase = await createClient()

    let error: any = null

    switch (action) {
      case "delete":
        console.log("🗑️ [bulkActionCourses] Executando ação: delete", {
          courseCount: courseIds.length,
        })
        const deleteResult = await supabase
          .from("courses")
          .delete()
          .in("id", courseIds)
        error = deleteResult.error
        break

      case "publish":
        console.log("📢 [bulkActionCourses] Executando ação: publish", {
          courseCount: courseIds.length,
        })
        const publishResult = await supabase
          .from("courses")
          .update({ is_published: true })
          .in("id", courseIds)
        error = publishResult.error
        break

      case "unpublish":
        console.log("🔒 [bulkActionCourses] Executando ação: unpublish", {
          courseCount: courseIds.length,
        })
        const unpublishResult = await supabase
          .from("courses")
          .update({ is_published: false })
          .in("id", courseIds)
        error = unpublishResult.error
        break
    }

    if (error) {
      console.error("❌ [bulkActionCourses] Erro ao executar ação em lote", {
        action,
        courseCount: courseIds.length,
        error: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        error: "Erro ao executar ação em lote. Tente novamente.",
      }
    }

    console.log("✅ [bulkActionCourses] Ação em lote executada com sucesso", {
      action,
      affected: courseIds.length,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
      data: { affected: courseIds.length },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ [bulkActionCourses] Erro inesperado", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: "Erro inesperado na ação em lote",
    }
  }
}
