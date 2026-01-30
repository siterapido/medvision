import { NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"
import { uuidSchemaWithMessage } from "@/lib/validations/uuid"
import { buildBunnyPublicUrl } from "@/lib/bunny/storage"

export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string; attachmentId: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

    const resolvedParams = await params
    const lessonId = uuidSchemaWithMessage("Parâmetros inválidos.").safeParse(resolvedParams.lessonId?.trim())
    const attachmentId = uuidSchemaWithMessage("Parâmetros inválidos.").safeParse(resolvedParams.attachmentId?.trim())
    if (!lessonId.success || !attachmentId.success) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId.data)
      .maybeSingle()
    if (lessonErr) {
      console.error("[download GET] erro ao buscar aula", lessonErr)
      return NextResponse.json({ error: "Falha ao validar aula." }, { status: 500 })
    }
    if (!lessonRow) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    const role = resolveUserRole(profile?.role, user)

    if (role !== "admin") {
      const { data: enrollment, error: enrollmentErr } = await supabase
        .from("user_courses")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("course_id", lessonRow.course_id)
        .maybeSingle()
      if (enrollmentErr) {
        console.error("[download GET] erro ao verificar participação", enrollmentErr)
        return NextResponse.json({ error: "Falha ao verificar acesso." }, { status: 500 })
      }
      if (!enrollment) {
        return NextResponse.json({ error: "Acesso negado ao anexo." }, { status: 403 })
      }
    }

    const admin = createAdminClient()
    const { data: attRow, error: attErr } = await (admin
      .from("lesson_attachments") as any)
      .select("id, storage_path, file_name")
      .eq("id", attachmentId.data)
      .eq("lesson_id", lessonId.data)
      .maybeSingle()

    if (attErr) {
      console.error("[download GET] erro ao buscar anexo", attErr)
      return NextResponse.json({ error: "Falha ao localizar anexo." }, { status: 500 })
    }
    if (!attRow) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 })

    const url = buildBunnyPublicUrl(attRow.storage_path)
    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    console.error("[download GET] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado ao preparar download." }, { status: 500 })
  }
}
