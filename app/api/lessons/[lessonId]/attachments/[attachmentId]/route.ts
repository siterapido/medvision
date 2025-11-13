import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"

const BUCKET = "lesson-attachments"

export async function DELETE(_: Request, { params }: { params: { lessonId: string; attachmentId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    const role = resolveUserRole(profile?.role, user)
    if (role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem remover anexos." }, { status: 403 })
    }

    const lessonId = params.lessonId
    const attachmentId = params.attachmentId
    if (!z.string().uuid().safeParse(lessonId).success || !z.string().uuid().safeParse(attachmentId).success) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: attRow, error: attErr } = await admin
      .from("lesson_attachments")
      .select("id, storage_path")
      .eq("id", attachmentId)
      .eq("lesson_id", lessonId)
      .maybeSingle()

    if (attErr) {
      console.error("[attachments DELETE] erro ao buscar anexo", attErr)
      return NextResponse.json({ error: "Falha ao localizar anexo." }, { status: 500 })
    }
    if (!attRow) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 })

    const { error: rmErr } = await admin.storage.from(BUCKET).remove([attRow.storage_path])
    if (rmErr) {
      console.error("[attachments DELETE] erro ao remover arquivo", rmErr)
      return NextResponse.json({ error: "Falha ao remover arquivo do storage." }, { status: 500 })
    }

    const { error: delErr } = await admin
      .from("lesson_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("lesson_id", lessonId)

    if (delErr) {
      console.error("[attachments DELETE] erro ao remover metadados", delErr)
      return NextResponse.json({ error: "Falha ao remover metadados do anexo." }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[attachments DELETE] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado ao remover anexo." }, { status: 500 })
  }
}

