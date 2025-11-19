"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  liveFormSchema,
  bulkLiveActionSchema,
  type LiveFormData,
  type BulkLiveActionData,
} from "@/lib/validations/live"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createLive(
  formData: LiveFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = liveFormSchema.safeParse(formData)
    if (!parsed.success) {
      const { fieldErrors: rawFieldErrors, formErrors } = parsed.error.flatten()
      const fieldErrors = Object.fromEntries(
        Object.entries(rawFieldErrors).filter(([, messages]) => messages && messages.length > 0)
      )
      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("lives")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || null,
        instructor: parsed.data.instructor,
        thumbnail_url: parsed.data.thumbnail_url || null,
        scheduled_at: parsed.data.scheduled_at,
        status: parsed.data.status,
        is_published: parsed.data.is_published ?? true,
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/lives")
    revalidatePath("/dashboard/cursos")

    return { success: true, data: { id: data.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function updateLive(
  liveId: string,
  formData: LiveFormData
): Promise<ActionResult> {
  try {
    const parsed = liveFormSchema.safeParse(formData)
    if (!parsed.success) {
      const { fieldErrors: rawFieldErrors, formErrors } = parsed.error.flatten()
      const fieldErrors = Object.fromEntries(
        Object.entries(rawFieldErrors).filter(([, messages]) => messages && messages.length > 0)
      )
      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
      }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("lives")
      .update({
        title: parsed.data.title,
        description: parsed.data.description || null,
        instructor: parsed.data.instructor,
        thumbnail_url: parsed.data.thumbnail_url || null,
        scheduled_at: parsed.data.scheduled_at,
        status: parsed.data.status,
        is_published: parsed.data.is_published ?? true,
      })
      .eq("id", liveId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/lives")
    revalidatePath("/dashboard/cursos")

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function deleteLive(liveId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("lives").delete().eq("id", liveId)
    if (error) {
      return { success: false, error: error.message }
    }
    revalidatePath("/admin/lives")
    revalidatePath("/dashboard/cursos")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function togglePublishLive(
  liveId: string,
  currentStatus: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("lives")
      .update({ is_published: !currentStatus })
      .eq("id", liveId)
    if (error) {
      return { success: false, error: error.message }
    }
    revalidatePath("/admin/lives")
    revalidatePath("/dashboard/cursos")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function bulkActionLives(
  actionData: BulkLiveActionData
): Promise<ActionResult<{ affected: number }>> {
  try {
    const parsed = bulkLiveActionSchema.safeParse(actionData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      return { success: false, error: "Dados inválidos", fieldErrors }
    }

    const { liveIds, action } = parsed.data
    const supabase = await createClient()

    let error: any = null
    switch (action) {
      case "delete":
        error = (await supabase.from("lives").delete().in("id", liveIds)).error
        break
      case "publish":
        error = (await supabase.from("lives").update({ is_published: true }).in("id", liveIds)).error
        break
      case "unpublish":
        error = (await supabase.from("lives").update({ is_published: false }).in("id", liveIds)).error
        break
    }

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/lives")
    revalidatePath("/dashboard/cursos")

    return { success: true, data: { affected: liveIds.length } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}