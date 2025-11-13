import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"

const BUCKET = "lesson-attachments"
const SIGNED_TTL_SECONDS = 60 * 10 // 10 minutos

export async function GET(_: Request, { params }: { params: { lessonId: string; attachmentId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

    const lessonId = params.lessonId
    const attachmentId = params.attachmentId
    if (!z.string().uuid().safeParse(lessonId).success || !z.string().uuid().safeParse(attachmentId).success) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
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
    const { data: attRow, error: attErr } = await admin
      .from("lesson_attachments")
      .select("id, storage_path, file_name")
      .eq("id", attachmentId)
      .eq("lesson_id", lessonId)
      .maybeSingle()

    if (attErr) {
      console.error("[download GET] erro ao buscar anexo", attErr)
      return NextResponse.json({ error: "Falha ao localizar anexo." }, { status: 500 })
    }
    if (!attRow) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 })

    const { data: signed, error: signedErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(attRow.storage_path, SIGNED_TTL_SECONDS, { download: attRow.file_name })

    if (signedErr || !signed?.signedUrl) {
      console.error("[download GET] erro ao gerar URL assinada", signedErr)
      return NextResponse.json({ error: "Falha ao gerar link de download." }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl }, { status: 200 })
  } catch (error) {
    console.error("[download GET] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado ao preparar download." }, { status: 500 })
  }
}

