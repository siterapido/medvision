import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"

/**
 * GET /api/admin/users/[id]
 * Busca detalhes completos de um usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const resolvedRole = resolveUserRole(profile?.role, user)

    if (resolvedRole !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem acessar esta rota." },
        { status: 403 }
      )
    }

    const { id } = await params
    const { data: userData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !userData) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      )
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("[api/admin/users/[id]] error:", error)
    return NextResponse.json(
      { error: "Erro inesperado ao buscar usuário." },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id]
 * Atualiza informações de um usuário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const resolvedRole = resolveUserRole(profile?.role, user)

    if (resolvedRole !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar usuários." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Preparar dados para atualização
    const updateData: Record<string, any> = {}
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.email !== undefined) {
      updateData.email = body.email
    }
    // telefone pode não existir na tabela, então só atualizamos se for fornecido
    if (body.telefone !== undefined && body.telefone !== null) {
      updateData.telefone = body.telefone || null
    }
    if (body.cro !== undefined) {
      updateData.cro = body.cro || null
    }
    if (body.especialidade !== undefined) {
      updateData.especialidade = body.especialidade || null
    }

    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[api/admin/users/[id]] error updating:", error)
      return NextResponse.json(
        { error: "Erro ao atualizar usuário." },
        { status: 400 }
      )
    }

    // Se o email foi alterado, também atualizar no auth.users
    if (body.email && updatedUser) {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.updateUserById(id, {
        email: body.email,
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[api/admin/users/[id]] error:", error)
    return NextResponse.json(
      { error: "Erro inesperado ao atualizar usuário." },
      { status: 500 }
    )
  }
}

