import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"

const CreateVendedorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
  name: z.string().min(2).max(80).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const resolvedRole = resolveUserRole(profile?.role, user)

    if (resolvedRole !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem criar vendedores." }, { status: 403 })
    }

    const json = await request.json()

    const parsed = CreateVendedorSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        name: parsed.data.name,
        role: "vendedor",
      },
    })

    if (error) {
      return NextResponse.json(
        {
          error: "Não foi possível criar o vendedor.",
          details: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        id: data.user?.id,
        email: data.user?.email,
        name: parsed.data.name ?? data.user?.user_metadata?.name ?? null,
        role: "vendedor",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[api/admin/users/vendedor] error:", error)
    return NextResponse.json(
      { error: "Erro inesperado ao criar vendedor." },
      { status: 500 },
    )
  }
}


