"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  courseFormSchema,
  bulkActionSchema,
  type CourseFormData,
  type BulkActionData,
} from "@/lib/validations/course"

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
    // Validação
    const parsed = courseFormSchema.safeParse(formData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Inserir curso
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        area: parsed.data.area,
        difficulty: parsed.data.difficulty,
        course_type: parsed.data.course_type,
        price: parsed.data.price || null,
        tags: parsed.data.tags || null,
        duration: parsed.data.duration || null,
        thumbnail_url: parsed.data.thumbnail_url || null,
        is_published: false,
        lessons_count: 0,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar curso:", error)
      return {
        success: false,
        error: "Erro ao criar curso. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error("Erro inesperado ao criar curso:", error)
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
    // Validação
    const parsed = courseFormSchema.safeParse(formData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    // Atualizar curso
    const { error } = await supabase
      .from("courses")
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        area: parsed.data.area,
        difficulty: parsed.data.difficulty,
        course_type: parsed.data.course_type,
        price: parsed.data.price || null,
        tags: parsed.data.tags || null,
        duration: parsed.data.duration || null,
        thumbnail_url: parsed.data.thumbnail_url || null,
      })
      .eq("id", courseId)

    if (error) {
      console.error("Erro ao atualizar curso:", error)
      return {
        success: false,
        error: "Erro ao atualizar curso. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")
    revalidatePath(`/dashboard/cursos/${courseId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao atualizar curso:", error)
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
    const supabase = await createClient()

    const { error } = await supabase.from("courses").delete().eq("id", courseId)

    if (error) {
      console.error("Erro ao deletar curso:", error)
      return {
        success: false,
        error: "Erro ao deletar curso. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao deletar curso:", error)
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
    const supabase = await createClient()

    const { error } = await supabase
      .from("courses")
      .update({ is_published: !currentStatus })
      .eq("id", courseId)

    if (error) {
      console.error("Erro ao alterar status de publicação:", error)
      return {
        success: false,
        error: "Erro ao alterar status de publicação. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro inesperado ao alterar status:", error)
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
    // Validação
    const parsed = bulkActionSchema.safeParse(actionData)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { courseIds, action } = parsed.data
    const supabase = await createClient()

    let error: any = null

    switch (action) {
      case "delete":
        const deleteResult = await supabase
          .from("courses")
          .delete()
          .in("id", courseIds)
        error = deleteResult.error
        break

      case "publish":
        const publishResult = await supabase
          .from("courses")
          .update({ is_published: true })
          .in("id", courseIds)
        error = publishResult.error
        break

      case "unpublish":
        const unpublishResult = await supabase
          .from("courses")
          .update({ is_published: false })
          .in("id", courseIds)
        error = unpublishResult.error
        break
    }

    if (error) {
      console.error("Erro na ação em lote:", error)
      return {
        success: false,
        error: "Erro ao executar ação em lote. Tente novamente.",
      }
    }

    revalidatePath("/admin/cursos")
    revalidatePath("/dashboard/cursos")

    return {
      success: true,
      data: { affected: courseIds.length },
    }
  } catch (error) {
    console.error("Erro inesperado na ação em lote:", error)
    return {
      success: false,
      error: "Erro inesperado na ação em lote",
    }
  }
}

/**
 * Upload de thumbnail para Supabase Storage
 */
export async function uploadCourseThumbnail(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return {
        success: false,
        error: "Nenhum arquivo enviado",
      }
    }

    // Validar tamanho e tipo
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "A imagem deve ter no máximo 5MB",
      }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Apenas imagens JPG, PNG ou WebP são permitidas",
      }
    }

    const supabase = await createClient()

    // Gerar nome único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop()
    const fileName = `course-${timestamp}-${randomString}.${extension}`
    const filePath = `thumbnails/${fileName}`

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("course-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError)
      return {
        success: false,
        error: "Erro ao fazer upload da imagem. Tente novamente.",
      }
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(filePath)

    return {
      success: true,
      data: { url: publicUrl },
    }
  } catch (error) {
    console.error("Erro inesperado no upload:", error)

    // Tratamento específico para erro de tamanho de corpo
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("Body exceeded") || errorMessage.includes("413")) {
      return {
        success: false,
        error: "O arquivo é muito grande. Limite máximo de upload é 5MB. Por favor, reduza o tamanho da imagem e tente novamente.",
      }
    }

    return {
      success: false,
      error: "Erro inesperado ao fazer upload",
    }
  }
}
