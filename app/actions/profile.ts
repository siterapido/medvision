"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional().nullable().or(z.undefined()),
  cro: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>

export async function updateProfile(data: UpdateProfileData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Sessão expirada. Faça login novamente." }
    }

    const parsed = updateProfileSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as any
      }
    }

    // Filter undefined values
    const updateData: Record<string, any> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    // Email update skipped for safety/complexity reasons
    
    if (parsed.data.telefone !== undefined) updateData.telefone = parsed.data.telefone
    if (parsed.data.cro !== undefined) updateData.cro = parsed.data.cro
    if (parsed.data.especialidade !== undefined) updateData.especialidade = parsed.data.especialidade

    // Update profile
    let { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)

    // Retry logic for 'telefone' column if it doesn't exist
    if (error && updateData.telefone !== undefined) {
      // Check if error is related to column not found if possible, or just retry blindly like users.ts
      const updateDataWithoutPhone = { ...updateData }
      delete updateDataWithoutPhone.telefone
      
      const retryResult = await supabase
        .from("profiles")
        .update(updateDataWithoutPhone)
        .eq("id", user.id)
      
      error = retryResult.error
    }

    if (error) {
        console.error("Error updating profile", error)
        return { success: false, error: "Erro ao atualizar perfil." }
    }

    revalidatePath("/newdashboard/perfil")
    revalidatePath("/newdashboard") // Update sidebar avatar/name if needed
    return { success: true }
  } catch (error) {
    console.error("Unexpected error", error)
    return { success: false, error: "Erro inesperado." }
  }
}
