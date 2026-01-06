"use server"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createBulkLessons } from "@/app/actions/lessons"
import { bulkLessonsSchema } from "@/lib/validations/lesson"
import type { BulkLessonsData } from "@/lib/validations/lesson"

/**
 * POST /api/admin/courses/[id]/lessons/import
 * 
 * Importa aulas em lote para um curso
 * 
 * Body esperado:
 * {
 *   lessons: [
 *     {
 *       title: string,
 *       description?: string,
 *       video_url?: string,
 *       duration_minutes?: number,
 *       module_title: string,
 *       order_index: number,
 *       materials?: Array<{title, type, url, description?}>,
 *       available_at?: string (ISO datetime)
 *     }
 *   ]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    
    // Verificar autenticação e permissões de admin
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se o curso existe
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
    }

    // Ler e validar dados do body
    const body = await request.json()
    
    const bulkData: BulkLessonsData = {
      course_id: courseId,
      lessons: body.lessons || [],
    }

    const parsed = bulkLessonsSchema.safeParse(bulkData)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Importar aulas
    const result = await createBulkLessons(parsed.data)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Erro ao importar aulas",
          fieldErrors: result.fieldErrors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${parsed.data.lessons.length} aula(s) importada(s) com sucesso`,
      data: result.data,
    })
  } catch (error) {
    console.error("Erro ao importar aulas:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}







