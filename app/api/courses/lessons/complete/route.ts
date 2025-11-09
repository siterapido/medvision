import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const CompleteLessonSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const json = await request.json()
    const parsed = CompleteLessonSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { courseId, lessonId } = parsed.data

    const { data: lessonMatch, error: lessonError } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", lessonId)
      .maybeSingle()

    if (lessonError) {
      console.error("[api/courses/lessons/complete] não foi possível buscar a aula:", lessonError)
      return NextResponse.json({ error: "Não foi possível localizar a aula." }, { status: 500 })
    }

    if (!lessonMatch || lessonMatch.course_id !== courseId) {
      return NextResponse.json({ error: "Aula inválida para o curso informado." }, { status: 400 })
    }

    const { error: markError } = await supabase
      .from("user_lessons")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      )

    if (markError) {
      console.error("[api/courses/lessons/complete] não foi possível marcar aula:", markError)
      return NextResponse.json({ error: "Não foi possível salvar o progresso." }, { status: 500 })
    }

    const { data: courseLessons, error: courseLessonsError } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId)

    if (courseLessonsError) {
      console.error("[api/courses/lessons/complete] erro ao buscar aulas do curso:", courseLessonsError)
      return NextResponse.json({ error: "Não foi possível calcular o progresso." }, { status: 500 })
    }

    const lessonIds = (courseLessons ?? []).map((lesson) => lesson.id).filter(Boolean)
    const totalLessons = lessonIds.length

    let completedLessons = 0

    if (lessonIds.length > 0) {
      const { count, error: completedCountError } = await supabase
        .from("user_lessons")
        .select("lesson_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
        .eq("is_completed", true)

      if (completedCountError) {
        console.error("[api/courses/lessons/complete] erro ao contar lições concluídas:", completedCountError)
        return NextResponse.json({ error: "Não foi possível calcular o progresso." }, { status: 500 })
      }

      completedLessons = count ?? 0
    }

    const progress = totalLessons === 0 ? 0 : Math.min(100, Math.round((completedLessons / totalLessons) * 100))

    const { error: userCourseError } = await supabase
      .from("user_courses")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          progress,
        },
        { onConflict: "user_id,course_id" },
      )

    if (userCourseError) {
      console.error("[api/courses/lessons/complete] erro ao atualizar progresso:", userCourseError)
      return NextResponse.json({ error: "Não foi possível salvar o progresso." }, { status: 500 })
    }

    return NextResponse.json({ success: true, progress }, { status: 200 })
  } catch (error) {
    console.error("[api/courses/lessons/complete] erro inesperado:", error)
    return NextResponse.json({ error: "Erro inesperado ao processar o progresso." }, { status: 500 })
  }
}
