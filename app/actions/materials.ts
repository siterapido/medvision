"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { materialFormSchema, type MaterialFormData } from "@/lib/validations/material"
import { parseMaterialTags } from "@/lib/material/helpers"

export type MaterialActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createMaterial(
  formData: MaterialFormData,
): Promise<MaterialActionResult<{ id: string }>> {
  try {
    const parsed = materialFormSchema.safeParse(formData)

    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten()
      const cleanedFieldErrors = Object.fromEntries(
        Object.entries(fieldErrors).filter(([, messages]) => messages && messages.length > 0),
      )

      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        fieldErrors: cleanedFieldErrors,
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("materials")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        pages: parsed.data.pages,
        tags: parseMaterialTags(parsed.data.tags),
        resource_type: parsed.data.resource_type,
        file_url: parsed.data.file_url,
      })
      .select("id")
      .single()

    if (error || !data) {
      console.error("Erro ao salvar material", { error })
      return {
        success: false,
        error: "Não foi possível salvar o material. Tente novamente.",
      }
    }

    revalidatePath("/dashboard/materiais")
    revalidatePath("/admin/materiais")

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (err) {
    console.error("Erro inesperado ao criar material", err)
    return {
      success: false,
      error: "Erro inesperado ao salvar material",
    }
  }
}
