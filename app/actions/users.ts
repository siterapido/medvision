"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveUserRole } from "@/lib/auth/roles"
import { getPublicSiteUrl } from "@/lib/site-url"
import { DEFAULT_TRIAL_DAYS, calculateTrialEndDate, normalizeTrialDays } from "@/lib/trial"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional().nullable().or(z.undefined()),
  cro: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
})

const updateRoleSchema = z.object({
  role: z.enum(["cliente", "admin", "vendedor"], {
    errorMap: () => ({ message: "Role deve ser 'cliente', 'admin' ou 'vendedor'" }),
  }),
})

type UpdateUserData = z.infer<typeof updateUserSchema>

async function ensureAdminAccess() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: "Sua sessão expirou. Faça login novamente.",
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const resolvedRole = resolveUserRole(profile?.role, user)

  if (resolvedRole !== "admin") {
    return {
      error: "Apenas administradores podem gerenciar usuários.",
    }
  }

  return { supabase, user }
}

/**
 * Atualiza informações do perfil de um usuário
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<ActionResult<{ id: string }>> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    // Validação
    const parsed = updateUserSchema.safeParse(data)
    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten()
      const cleanedFieldErrors = Object.fromEntries(
        Object.entries(fieldErrors).filter(([, messages]) => messages && messages.length > 0)
      )

      return {
        success: false,
        error: formErrors?.[0] || "Dados inválidos",
        fieldErrors: cleanedFieldErrors,
      }
    }

    const supabase = adminCheck.supabase

    // Preparar dados para atualização (remover undefined)
    const updateData: Record<string, any> = {}
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name
    }
    if (parsed.data.email !== undefined) {
      updateData.email = parsed.data.email
    }
    // telefone pode não existir na tabela - só atualizamos se fornecido explicitamente
    // e se a atualização não falhar (a coluna pode não existir)
    if (parsed.data.telefone !== undefined) {
      updateData.telefone = parsed.data.telefone || null
    }
    if (parsed.data.cro !== undefined) {
      updateData.cro = parsed.data.cro || null
    }
    if (parsed.data.especialidade !== undefined) {
      updateData.especialidade = parsed.data.especialidade || null
    }

    // Tentar atualizar - se falhar por causa do telefone (coluna não existe), tentar sem ele
    let { data: updatedUser, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id")
      .single()

    // Se o erro for relacionado a telefone (coluna não existe), tentar novamente sem ele
    if (error && updateData.telefone !== undefined) {
      const updateDataWithoutPhone = { ...updateData }
      delete updateDataWithoutPhone.telefone
      
      const retryResult = await supabase
        .from("profiles")
        .update(updateDataWithoutPhone)
        .eq("id", userId)
        .select("id")
        .single()
      
      updatedUser = retryResult.data
      error = retryResult.error
    }

    if (error || !updatedUser) {
      console.error("Erro ao atualizar usuário", { error })
      return {
        success: false,
        error: "Não foi possível atualizar o usuário. Tente novamente.",
      }
    }

    // Se o email foi alterado, também atualizar no auth.users
    if (parsed.data.email) {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.updateUserById(userId, {
        email: parsed.data.email,
      })
    }

    revalidatePath("/admin/usuarios")

    return {
      success: true,
      data: { id: updatedUser.id },
    }
  } catch (err) {
    console.error("Erro inesperado ao atualizar usuário", err)
    return {
      success: false,
      error: "Erro inesperado ao atualizar usuário",
    }
  }
}

/**
 * Atualiza o role de um usuário
 */
export async function updateUserRole(
  userId: string,
  role: "cliente" | "admin" | "vendedor"
): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    // Validação
    const parsed = updateRoleSchema.safeParse({ role })
    if (!parsed.success) {
      return {
        success: false,
        error: "Role inválido",
      }
    }

    // Não permitir remover o último admin
    if (role === "cliente" && adminCheck.user.id === userId) {
      return {
        success: false,
        error: "Você não pode remover seu próprio acesso de administrador.",
      }
    }

    const supabase = adminCheck.supabase

    const { error } = await supabase
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", userId)

    if (error) {
      console.error("Erro ao atualizar role", { error })
      return {
        success: false,
        error: "Não foi possível atualizar o role. Tente novamente.",
      }
    }

    // Atualizar também no auth.users metadata
    const adminClient = createAdminClient()
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: parsed.data.role,
      },
    })

    revalidatePath("/admin/usuarios")

    return {
      success: true,
    }
  } catch (err) {
    console.error("Erro inesperado ao atualizar role", err)
    return {
      success: false,
      error: "Erro inesperado ao atualizar role",
    }
  }
}

/**
 * Busca detalhes completos de um usuário
 */
export async function getUserDetails(userId: string): Promise<ActionResult<any>> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    const supabase = adminCheck.supabase

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error || !user) {
      console.error("Erro ao buscar usuário", { error })
      return {
        success: false,
        error: "Usuário não encontrado.",
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (err) {
    console.error("Erro inesperado ao buscar usuário", err)
    return {
      success: false,
      error: "Erro inesperado ao buscar usuário",
    }
  }
}

const updatePlanSchema = z.object({
  plan_type: z.enum(["free", "monthly", "annual"]).optional(),
  subscription_status: z
    .enum(["free", "active", "canceled", "past_due", "refunded"])
    .optional(),
})

const updateTrialSchema = z.object({
  action: z.enum(["start", "clear", "mark_used"], {
    errorMap: () => ({ message: "Ação de trial inválida" }),
  }),
  days: z.number().int().positive().optional(),
})

type UpdatePlanData = z.infer<typeof updatePlanSchema>

/**
 * Redefine a senha de um usuário diretamente
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "A senha deve ter pelo menos 8 caracteres",
      }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("Erro ao redefinir senha", { error })
      return {
        success: false,
        error: "Não foi possível redefinir a senha. Tente novamente.",
      }
    }

    revalidatePath(`/admin/usuarios/${userId}`)
    revalidatePath("/admin/usuarios")

    return {
      success: true,
    }
  } catch (err) {
    console.error("Erro inesperado ao redefinir senha", err)
    return {
      success: false,
      error: "Erro inesperado ao redefinir senha",
    }
  }
}

/**
 * Envia um email de redefinição de senha para o usuário
 */
export async function sendPasswordResetEmail(email: string): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    if (!email || !email.includes("@")) {
      return {
        success: false,
        error: "Email inválido",
      }
    }

    // Usar o cliente normal do Supabase para enviar o email de redefinição
    // O método resetPasswordForEmail envia o email automaticamente
    const supabase = adminCheck.supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getPublicSiteUrl()}/auth/callback?next=/dashboard`,
    })

    if (error) {
      console.error("Erro ao enviar email de redefinição", { error })
      return {
        success: false,
        error: "Não foi possível enviar o email de redefinição. Tente novamente.",
      }
    }

    return {
      success: true,
    }
  } catch (err) {
    console.error("Erro inesperado ao enviar email de redefinição", err)
    return {
      success: false,
      error: "Erro inesperado ao enviar email de redefinição",
    }
  }
}

/**
 * Atualiza o plano e status da assinatura de um usuário
 */
export async function updateUserPlan(
  userId: string,
  data: UpdatePlanData
): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    // Validação
    const parsed = updatePlanSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos",
      }
    }

    const supabase = adminCheck.supabase

    // Preparar dados para atualização
    const updateData: Record<string, any> = {}
    if (parsed.data.plan_type !== undefined) {
      updateData.plan_type = parsed.data.plan_type
    }
    if (parsed.data.subscription_status !== undefined) {
      updateData.subscription_status = parsed.data.subscription_status
    }

    // Se o plano foi alterado para free, também atualizar o status
    if (parsed.data.plan_type === "free" && !parsed.data.subscription_status) {
      updateData.subscription_status = "free"
    }

    // Se o plano foi alterado para mensal ou anual e não há status definido, definir como active
    if (
      (parsed.data.plan_type === "monthly" || parsed.data.plan_type === "annual") &&
      !parsed.data.subscription_status
    ) {
      updateData.subscription_status = "active"
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Erro ao atualizar plano", { error })
      return {
        success: false,
        error: "Não foi possível atualizar o plano. Tente novamente.",
      }
    }

    revalidatePath(`/admin/usuarios/${userId}`)
    revalidatePath("/admin/usuarios")

    return {
      success: true,
    }
  } catch (err) {
    console.error("Erro inesperado ao atualizar plano", err)
    return {
      success: false,
      error: "Erro inesperado ao atualizar plano",
    }
  }
}

/**
 * Atualiza informações do trial de um usuário
 */
export async function updateUserTrial(
  userId: string,
  payload: z.infer<typeof updateTrialSchema>
): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    const parsed = updateTrialSchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: "Ação de trial inválida",
      }
    }

    const supabase = adminCheck.supabase
    const { action, days } = parsed.data

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan_type, subscription_status, trial_used, trial_started_at, trial_ends_at, pipeline_stage")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("Erro ao carregar perfil para trial", { profileError })
      return {
        success: false,
        error: "Não foi possível carregar o perfil do usuário",
      }
    }

    const hasPremiumPlan = profile?.plan_type && profile.plan_type !== "free"
    if (action === "start" && hasPremiumPlan) {
      return {
        success: false,
        error: "Usuários premium não podem receber novo trial.",
      }
    }

    if (action === "start" && profile?.trial_used) {
      return {
        success: false,
        error: "Trial já foi marcado como utilizado. Limpe ou remova marcação antes de reabrir.",
      }
    }

    let updateData: Record<string, any> = {}

    switch (action) {
      case "start": {
        const startDate = new Date()
        const trialDays = normalizeTrialDays(days, DEFAULT_TRIAL_DAYS)
        const endDate = calculateTrialEndDate(startDate, trialDays)
        updateData = {
          trial_started_at: startDate.toISOString(),
          trial_ends_at: endDate.toISOString(),
          trial_used: false,
          // Preserva o pipeline_stage se já existir, caso contrário define como 'novo_usuario'
          pipeline_stage: profile?.pipeline_stage || "novo_usuario",
        }
        break
      }
      case "clear": {
        updateData = {
          trial_started_at: null,
          trial_ends_at: null,
          trial_used: false,
        }
        break
      }
      case "mark_used": {
        updateData = {
          trial_started_at: null,
          trial_ends_at: null,
          trial_used: true,
        }
        break
      }
      default: {
        return {
          success: false,
          error: "Ação de trial não suportada",
        }
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Erro ao atualizar trial", { error })
      return {
        success: false,
        error: "Não foi possível atualizar o trial. Tente novamente.",
      }
    }

    revalidatePath(`/admin/usuarios/${userId}`)
    revalidatePath("/admin/usuarios")

    return {
      success: true,
    }
  } catch (err) {
    console.error("Erro inesperado ao atualizar trial", err)
    return {
      success: false,
      error: "Erro inesperado ao atualizar trial",
    }
  }
}

/**
 * Exclui um usuário e seu perfil
 * 
 * IMPORTANTE: A ordem de exclusão é crítica:
 * 1. Deletar o usuário do auth.users primeiro
 * 2. Isso automaticamente deleta o perfil devido ao ON DELETE CASCADE
 * 3. Isso também deleta todas as outras dependências (course_purchases, payment_history, etc)
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    if (adminCheck.user.id === userId) {
      return {
        success: false,
        error: "Você não pode excluir a si mesmo.",
      }
    }

    // Verificar se o usuário existe antes de tentar deletar
    const supabase = adminCheck.supabase
    const { data: userProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Erro ao verificar usuário", { checkError })
      return {
        success: false,
        error: "Erro ao verificar usuário. Tente novamente.",
      }
    }

    if (!userProfile) {
      return {
        success: false,
        error: "Usuário não encontrado.",
      }
    }

    const adminClient = createAdminClient()

    // IMPORTANTE: A foreign key profiles_id_fkey não tem ON DELETE CASCADE
    // Precisamos deletar o perfil primeiro para evitar problemas de constraint
    // Depois deletamos o usuário do auth.users (que remove sessões, tokens, etc.)
    
    // 1. Deletar o perfil primeiro (isso remove dependências em outras tabelas via CASCADE)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      console.error("Erro ao excluir perfil", {
        profileError,
        userId,
        message: profileError.message,
      })
      // Continua tentando deletar o usuário mesmo se o perfil falhar
    }

    // 2. Deletar o usuário do auth.users
    // Isso remove sessões, tokens, identidades, etc. automaticamente via CASCADE
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Erro ao excluir usuário de auth", { 
        authError,
        userId,
        message: authError.message,
      })
      return {
        success: false,
        error: authError.message || "Não foi possível remover o usuário. Verifique dependências antes de tentar novamente.",
      }
    }

    revalidatePath(`/admin/usuarios/${userId}`)
    revalidatePath("/admin/usuarios")

    return {
      success: true,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("Erro inesperado ao excluir usuário", {
      err,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return {
      success: false,
      error: "Erro inesperado ao excluir usuário",
    }
  }
}

const bulkDeleteUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um usuário"),
})

/**
 * Exclui múltiplos usuários em lote
 * 
 * IMPORTANTE: A ordem de exclusão é crítica:
 * 1. Deletar os usuários do auth.users primeiro
 * 2. Isso automaticamente deleta os perfis devido ao ON DELETE CASCADE
 * 3. Isso também deleta todas as outras dependências (course_purchases, payment_history, etc)
 */
export async function bulkDeleteUsers(
  actionData: z.infer<typeof bulkDeleteUsersSchema>
): Promise<ActionResult<{ affected: number; failed: number }>> {
  try {
    const adminCheck = await ensureAdminAccess()
    if ("error" in adminCheck) {
      return {
        success: false,
        error: adminCheck.error,
      }
    }

    // Validação
    const parsed = bulkDeleteUsersSchema.safeParse(actionData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors,
      }
    }

    const { userIds } = parsed.data
    const adminClient = createAdminClient()
    const supabase = adminCheck.supabase

    // Verificar se algum dos usuários selecionados é o próprio admin
    if (userIds.includes(adminCheck.user.id)) {
      return {
        success: false,
        error: "Você não pode excluir a si mesmo.",
      }
    }

    // Verificar se os usuários existem antes de tentar deletar
    const { data: userProfiles, error: checkError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .in("id", userIds)

    if (checkError) {
      console.error("Erro ao verificar usuários", { checkError })
      return {
        success: false,
        error: "Erro ao verificar usuários. Tente novamente.",
      }
    }

    if (!userProfiles || userProfiles.length === 0) {
      return {
        success: false,
        error: "Nenhum usuário encontrado para excluir.",
      }
    }

    // IMPORTANTE: A foreign key profiles_id_fkey não tem ON DELETE CASCADE
    // Precisamos deletar o perfil primeiro, depois o usuário do auth
    // Isso garante que todas as dependências sejam removidas corretamente
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        // 1. Deletar o perfil primeiro (isso remove dependências em outras tabelas)
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId)

        if (profileError) {
          console.error("Erro ao excluir perfil", {
            profileError,
            userId,
            message: profileError.message,
          })
          // Continua tentando deletar o usuário mesmo se o perfil falhar
        }

        // 2. Deletar o usuário do auth.users
        // Isso remove sessões, tokens, identidades, etc. automaticamente via CASCADE
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

        if (authError) {
          console.error("Erro ao excluir usuário de auth", {
            authError,
            userId,
            message: authError.message,
          })
          failedCount++
          errors.push(`Erro ao excluir ${userId}: ${authError.message}`)
        } else {
          successCount++
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error("Erro inesperado ao excluir usuário", {
          err,
          userId,
          message: errorMessage,
        })
        failedCount++
        errors.push(`Erro ao excluir ${userId}: ${errorMessage}`)
      }
    }

    revalidatePath("/admin/usuarios")

    if (failedCount > 0 && successCount === 0) {
      return {
        success: false,
        error: `Falha ao excluir todos os usuários. ${errors[0]}`,
      }
    }

    if (failedCount > 0) {
      return {
        success: true,
        data: { affected: successCount, failed: failedCount },
        error: `${successCount} usuário(s) excluído(s) com sucesso. ${failedCount} falha(ram).`,
      }
    }

    return {
      success: true,
      data: { affected: successCount, failed: failedCount },
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("Erro inesperado ao excluir usuários em lote", {
      err,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return {
      success: false,
      error: "Erro inesperado ao excluir usuários em lote",
    }
  }
}
