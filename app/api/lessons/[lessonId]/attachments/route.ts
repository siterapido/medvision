import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"
import { allowedMimeSchema, maxBytesFromEnv } from "@/lib/attachments/validate"
import { uuidSchemaWithMessage } from "@/lib/validations/uuid"
import { deleteFromBunnyStorage, uploadToBunnyStorage } from "@/lib/bunny/storage"

const MAX_BYTES = maxBytesFromEnv(10)

const UploadParamsSchema = z.object({
  file: z.instanceof(File),
})

const LinkParamsSchema = z.object({
  url: z.string().url(),
  file_name: z.string().optional(),
})

const getCdnBase = () => {
  const base = process.env.BUNNY_CDN_BASE_URL
  if (!base) {
    throw new Error("BUNNY_CDN_BASE_URL não configurada.")
  }
  return base.replace(/\/+$/, "")
}

function inferPathFromUrl(rawUrl: string): { path: string; fileName: string } {
  const normalized = rawUrl.trim()
  const url = new URL(normalized)
  const cdnBaseUrl = new URL(getCdnBase())

  let path = url.pathname.replace(/^\/+/, "")
  // Se vier com domínio CDN, apenas usa o path após o domínio
  if (url.origin === cdnBaseUrl.origin) {
    path = url.pathname.replace(/^\/+/, "")
  }

  const fileName = path.split("/").pop() || url.searchParams.get("download") || "arquivo"
  return { path, fileName }
}

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
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

    const { lessonId } = await params
    const validLessonId = uuidSchemaWithMessage("ID da aula inválido.").safeParse(lessonId?.trim())
    if (!validLessonId.success) {
      return NextResponse.json({ error: "ID da aula inválido." }, { status: 400 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", validLessonId.data)
      .maybeSingle()
    if (lessonErr) {
      console.error("[attachments POST] erro ao buscar aula", lessonErr)
      return NextResponse.json({ error: "Falha ao validar aula." }, { status: 500 })
    }
    if (!lessonRow) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 })

    const admin = createAdminClient()
    const contentType = request.headers.get("content-type") || ""
    const isJson = contentType.includes("application/json")
    let parsedUpload: ReturnType<typeof UploadParamsSchema["safeParse"]> | null = null
    let parsedLink: ReturnType<typeof LinkParamsSchema["safeParse"]> | null = null

    if (isJson) {
      const jsonPayload = await request.json().catch(() => null)
      parsedLink = jsonPayload ? LinkParamsSchema.safeParse(jsonPayload) : null
    } else {
      const form = await request.formData().catch(() => null)
      const file = form?.get("file")
      parsedUpload = file ? UploadParamsSchema.safeParse({ file }) : null
    }

    let storagePath = ""
    let fileName = ""
    let mime = "application/octet-stream"
    let size = 0

    if (parsedUpload?.success) {
      const fileObj = parsedUpload.data.file
      mime = fileObj.type || "application/octet-stream"
      size = fileObj.size

      const mimeOk = allowedMimeSchema.safeParse(mime).success
      if (!mimeOk) {
        return NextResponse.json({ error: "Tipo de arquivo não suportado." }, { status: 415 })
      }
      if (size > MAX_BYTES) {
        return NextResponse.json({ error: "Arquivo excede o limite permitido." }, { status: 413 })
      }

      const ext = (() => {
        const name = fileObj.name || "arquivo"
        const parts = name.split(".")
        return parts.length > 1 ? parts.pop()! : "bin"
      })()
      storagePath = `lessons/${validLessonId.data}/${crypto.randomUUID()}.${ext}`
      fileName = fileObj.name || `arquivo.${ext}`

      try {
        await uploadToBunnyStorage(storagePath, fileObj, {
          contentType: mime,
          cacheControl: "public, max-age=31536000",
        })
      } catch (uploadErr) {
        console.error("[attachments POST] erro de upload no Bunny", uploadErr)
        return NextResponse.json({ error: "Não foi possível enviar o arquivo." }, { status: 500 })
      }
    } else if (parsedLink?.success) {
      try {
        const { path, fileName: derivedName } = inferPathFromUrl(parsedLink.data.url)
        storagePath = path
        fileName = parsedLink.data.file_name || derivedName
        mime = "application/octet-stream"
        size = 0
      } catch (err) {
        return NextResponse.json({ error: "URL do Bunny inválida." }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Informe um arquivo ou uma URL do Bunny." }, { status: 400 })
    }

    const { data: insertData, error: insertErr } = await (admin
      .from("lesson_attachments") as any)
      .insert({
        lesson_id: validLessonId.data,
        file_name: fileName,
        mime_type: mime,
        size_bytes: size,
        storage_path: storagePath,
        uploaded_by: user.id,
      })
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
      .maybeSingle()

    if (insertErr || !insertData) {
      console.error("[attachments POST] erro ao gravar metadata", insertErr)
      // Tentar apagar o arquivo para evitar órfão
      try {
        await deleteFromBunnyStorage(storagePath)
      } catch (cleanupErr) {
        console.error("[attachments POST] falha ao remover arquivo órfão no Bunny", cleanupErr)
      }
      return NextResponse.json({ error: "Falha ao salvar metadados do anexo." }, { status: 500 })
    }

    return NextResponse.json({ success: true, attachment: insertData }, { status: 201 })
  } catch (error) {
    console.error("[attachments POST] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado no upload." }, { status: 500 })
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

    const { lessonId } = await params
    const validLessonId = uuidSchemaWithMessage("ID da aula inválido.").safeParse(lessonId?.trim())
    if (!validLessonId.success) {
      // Para evitar quebra em aulas antigas com IDs não compatíveis, retornamos lista vazia
      return NextResponse.json({ attachments: [] }, { status: 200 })
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", validLessonId.data)
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
    const { data: rows, error: listErr } = await (admin
      .from("lesson_attachments") as any)
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
      .eq("lesson_id", validLessonId.data)
      .order("created_at", { ascending: false })

    if (listErr) {
      const missingTable =
        listErr.code === "42P01" ||
        listErr.code === "PGRST116" ||
        (typeof listErr.message === "string" && listErr.message.includes("lesson_attachments"))
      const invalidUuid = listErr.code === "22P02"
      if (missingTable) {
        console.warn("[attachments GET] tabela lesson_attachments ausente; retornando lista vazia")
        return NextResponse.json({ attachments: [] }, { status: 200 })
      }
      if (invalidUuid) {
        console.warn("[attachments GET] lesson_id inválido ao listar anexos; retornando lista vazia")
        return NextResponse.json({ attachments: [] }, { status: 200 })
      }
      console.error("[attachments GET] erro ao listar anexos", listErr)
      return NextResponse.json({ error: "Não foi possível listar anexos." }, { status: 500 })
    }

    return NextResponse.json({ attachments: rows ?? [] }, { status: 200 })
  } catch (error) {
    console.error("[attachments GET] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado ao listar anexos." }, { status: 500 })
  }
}
