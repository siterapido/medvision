"use server"

import { revalidatePath } from "next/cache"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"
import { materialFormSchema, type MaterialFormData } from "@/lib/validations/material"
import { parseMaterialTags } from "@/lib/material/helpers"

export type MaterialActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type AdminClientResult =
  | { supabase: SupabaseServerClient }
  | { error: string }

async function ensureAdminAccess(): Promise<AdminClientResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Sua sessão expirou. Faça login novamente antes de publicar materiais.",
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("[materials] Falha ao carregar perfil do usuário", profileError)
  }

  const resolvedRole = resolveUserRole(profile?.role, user)

  if (resolvedRole === "admin") {
    return { supabase }
  }

  const synced = await syncAdminProfile(user, profile?.role)
  if (synced) {
    return { supabase }
  }

  return {
    error: "Apenas administradores podem gerenciar materiais.",
  }
}

async function syncAdminProfile(user: User, currentRole?: string | null): Promise<boolean> {
  if (currentRole === "admin") {
    return true
  }

  const metadataRole =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role
      : typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role
        : undefined
  if (metadataRole !== "admin") {
    return false
  }

  try {
    const adminClient = createAdminClient()
    const displayName = getProfileNameFallback(user)

    const { error } = await (adminClient
      .from("profiles") as any)
      .upsert(
        {
          id: user.id,
          name: displayName,
          email: user.email ?? null,
          role: "admin",
        },
        { onConflict: "id" },
      )

    if (error) {
      console.error("[materials] Erro ao sincronizar perfil admin", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[materials] Erro inesperado ao preparar perfil admin", error)
    return false
  }
}

function getProfileNameFallback(user: User): string {
  if (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim().length > 0) {
    return user.user_metadata.name.trim()
  }

  if (typeof user.email === "string" && user.email.length > 0) {
    return user.email.split("@")[0] ?? "Admin"
  }

  return "Admin"
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

    const adminClient = await ensureAdminAccess()
    if ("error" in adminClient) {
      return {
        success: false,
        error: adminClient.error,
      }
    }

    const supabase = adminClient.supabase

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

export async function updateMaterial(
  id: string,
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

    const adminClient = await ensureAdminAccess()
    if ("error" in adminClient) {
      return {
        success: false,
        error: adminClient.error,
      }
    }

    const supabase = adminClient.supabase

    const { data, error } = await supabase
      .from("materials")
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        pages: parsed.data.pages,
        tags: parseMaterialTags(parsed.data.tags),
        resource_type: parsed.data.resource_type,
        file_url: parsed.data.file_url,
        is_available: parsed.data.is_available ?? true,
      })
      .eq("id", id)
      .select("id")
      .single()

    if (error || !data) {
      console.error("Erro ao atualizar material", { error })
      return {
        success: false,
        error: "Não foi possível atualizar o material. Tente novamente.",
      }
    }

    revalidatePath("/dashboard/materiais")
    revalidatePath("/admin/materiais")

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (err) {
    console.error("Erro inesperado ao atualizar material", err)
    return {
      success: false,
      error: "Erro inesperado ao atualizar material",
    }
  }
}

export async function deleteMaterial(id: string): Promise<MaterialActionResult<{ id: string }>> {
  try {
    const adminClient = await ensureAdminAccess()
    if ("error" in adminClient) {
      return {
        success: false,
        error: adminClient.error,
      }
    }

    const supabase = adminClient.supabase

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir material", { error })
      return {
        success: false,
        error: "Não foi possível excluir o material. Tente novamente.",
      }
    }

    revalidatePath("/dashboard/materiais")
    revalidatePath("/admin/materiais")

    return {
      success: true,
      data: { id },
    }
  } catch (err) {
    console.error("Erro inesperado ao excluir material", err)
    return {
      success: false,
      error: "Erro inesperado ao excluir material",
    }
  }
}
