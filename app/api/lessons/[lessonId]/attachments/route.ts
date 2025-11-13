import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"
import { allowedMimeSchema, maxBytesFromEnv } from "@/lib/attachments/validate"

const MAX_BYTES = maxBytesFromEnv(10)
const BUCKET = "lesson-attachments"


const UploadParamsSchema = z.object({
  file: z.instanceof(File),
})

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
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
      return NextResponse.json({ error: "Apenas administradores podem enviar anexos." }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get("file")
    const parsed = UploadParamsSchema.safeParse({ file })
    if (!parsed.success) {
      return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 })
    }

    const lessonId = params.lessonId
    if (!z.string().uuid().safeParse(lessonId).success) {
      return NextResponse.json({ error: "ID da aula inválido." }, { status: 400 })
    }

    const fileObj = parsed.data.file
    const mime = fileObj.type || "application/octet-stream"
    const size = fileObj.size

    const mimeOk = allowedMimeSchema.safeParse(mime).success
    if (!mimeOk) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado." }, { status: 415 })
    }
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo excede o limite permitido." }, { status: 413 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .maybeSingle()
    if (lessonErr) {
      console.error("[attachments POST] erro ao buscar aula", lessonErr)
      return NextResponse.json({ error: "Falha ao validar aula." }, { status: 500 })
    }
    if (!lessonRow) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 })

    const admin = createAdminClient()
    const ext = (() => {
      const name = fileObj.name || "arquivo"
      const parts = name.split(".")
      return parts.length > 1 ? parts.pop()! : "bin"
    })()
    const path = `lessons/${lessonId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, fileObj, {
      cacheControl: "3600",
      upsert: false,
    })
    if (uploadErr) {
      console.error("[attachments POST] erro de upload", uploadErr)
      return NextResponse.json({ error: "Não foi possível enviar o arquivo." }, { status: 500 })
    }

    const { data: insertData, error: insertErr } = await admin
      .from("lesson_attachments")
      .insert({
        lesson_id: lessonId,
        file_name: fileObj.name || `arquivo.${ext}`,
        mime_type: mime,
        size_bytes: size,
        storage_path: path,
        uploaded_by: user.id,
      })
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
      .maybeSingle()

    if (insertErr || !insertData) {
      console.error("[attachments POST] erro ao gravar metadata", insertErr)
      // Tentar apagar o arquivo para evitar órfão
      await admin.storage.from(BUCKET).remove([path]).catch(() => {})
      return NextResponse.json({ error: "Falha ao salvar metadados do anexo." }, { status: 500 })
    }

    return NextResponse.json({ success: true, attachment: insertData }, { status: 201 })
  } catch (error) {
    console.error("[attachments POST] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado no upload." }, { status: 500 })
  }
}

export async function GET(_: Request, { params }: { params: { lessonId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

    const lessonId = params.lessonId
    if (!z.string().uuid().safeParse(lessonId).success) {
      return NextResponse.json({ error: "ID da aula inválido." }, { status: 400 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
      .maybeSingle()
    if (lessonErr) {
      console.error("[attachments GET] erro ao buscar aula", lessonErr)
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
        console.error("[attachments GET] erro ao verificar participação", enrollmentErr)
        return NextResponse.json({ error: "Falha ao verificar acesso." }, { status: 500 })
      }
      if (!enrollment) {
        return NextResponse.json({ error: "Acesso negado aos anexos desta aula." }, { status: 403 })
      }
    }

    const admin = createAdminClient()
    const { data: rows, error: listErr } = await admin
      .from("lesson_attachments")
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false })

    if (listErr) {
      console.error("[attachments GET] erro ao listar anexos", listErr)
      return NextResponse.json({ error: "Não foi possível listar anexos." }, { status: 500 })
    }

    return NextResponse.json({ attachments: rows ?? [] }, { status: 200 })
  } catch (error) {
    console.error("[attachments GET] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado ao listar anexos." }, { status: 500 })
  }
}
