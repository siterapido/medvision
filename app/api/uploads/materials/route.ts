import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"
import { allowedMimeSchema, maxBytesFromEnv } from "@/lib/attachments/validate"
import { uploadToBunnyStorage } from "@/lib/bunny/storage"

const MAX_BYTES = maxBytesFromEnv(10)

const UploadSchema = z.object({
  file: z.instanceof(File),
  folder: z.string().optional(),
})

const sanitizeFolder = (input?: string | null) => {
  if (!input) return "materials"
  const trimmed = input.trim().replace(/^\/+|\/+$/g, "")
  const safeParts = trimmed
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
  return safeParts.length > 0 ? safeParts.join("/") : "materials"
}

export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Apenas administradores podem enviar arquivos." }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get("file")
    const folder = form.get("folder")
    const parsed = UploadSchema.safeParse({ file, folder })
    if (!parsed.success) {
      return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 })
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

    const ext = (() => {
      const name = fileObj.name || "arquivo"
      const parts = name.split(".")
      return parts.length > 1 ? parts.pop()! : "bin"
    })()
    const baseFolder = sanitizeFolder(parsed.data.folder)
    const path = `${baseFolder}/${crypto.randomUUID()}.${ext}`

    const { publicUrl, path: storedPath } = await uploadToBunnyStorage(path, fileObj, {
      contentType: mime,
      cacheControl: "public, max-age=31536000",
    })

    return NextResponse.json({ success: true, publicUrl, path: storedPath }, { status: 201 })
  } catch (error) {
    console.error("[uploads/materials POST] erro inesperado", error)
    return NextResponse.json({ error: "Erro inesperado no upload." }, { status: 500 })
  }
}
