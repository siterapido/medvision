import { NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"
import { uuidSchemaWithMessage } from "@/lib/validations/uuid"
import { deleteFromBunnyStorage } from "@/lib/bunny/storage"

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

    const lessonId = uuidSchemaWithMessage("Parâmetros inválidos.").safeParse(params.lessonId?.trim())
    const attachmentId = uuidSchemaWithMessage("Parâmetros inválidos.").safeParse(params.attachmentId?.trim())
    if (!lessonId.success || !attachmentId.success) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: attRow, error: attErr } = await admin
      .from("lesson_attachments")
      .select("id, storage_path")
      .eq("id", attachmentId.data)
      .eq("lesson_id", lessonId.data)
      .maybeSingle()

    if (attErr) {
      console.error("[attachments DELETE] erro ao buscar anexo", attErr)
      return NextResponse.json({ error: "Falha ao localizar anexo." }, { status: 500 })
    }
    if (!attRow) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 })

    try {
      await deleteFromBunnyStorage(attRow.storage_path)
    } catch (rmErr) {
      console.error("[attachments DELETE] erro ao remover arquivo no Bunny", rmErr)
      return NextResponse.json({ error: "Falha ao remover arquivo do storage." }, { status: 500 })
    }

    const { error: delErr } = await admin
      .from("lesson_attachments")
      .delete()
      .eq("id", attachmentId.data)
      .eq("lesson_id", lessonId.data)

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
