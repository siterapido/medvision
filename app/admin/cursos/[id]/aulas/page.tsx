import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { LessonManager } from "@/components/admin/lesson-manager"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Gerenciar Aulas | Admin",
  description: "Gerenciar aulas de um curso",
}

async function LessonsContent({ courseId }: { courseId: string }) {
  const supabase = await createClient()

  // Buscar informações do curso
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, lessons_count")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    console.error("Erro ao buscar curso:", courseError)
    notFound()
  }

  // Buscar módulos e aulas
  const [modulesResult, lessonsResult] = await Promise.all([
    supabase
      .from("lesson_modules")
      .select("id, title, description, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true }),
    supabase
      .from("lessons")
      .select(
        "id, title, description, video_url, module_title, module_id, duration_minutes, order_index, materials, available_at"
      )
      .eq("course_id", courseId)
      .order("order_index", { ascending: true }),
  ])

  if (modulesResult.error) {
    console.error("Erro ao buscar módulos:", modulesResult.error)
  }
  if (lessonsResult.error) {
    console.error("Erro ao buscar aulas:", lessonsResult.error)
  }

  const lessons = lessonsResult.data || []
  const modulesFromDb = modulesResult.data || []

  const modulesWithLessons = modulesFromDb.map((module) => ({
    ...module,
    lessons: lessons.filter((lesson) => lesson.module_id === module.id),
  }))

  const unassignedLessons = lessons.filter((lesson) => !lesson.module_id)

  const modulesPayload = unassignedLessons.length
    ? [
        {
          id: null,
          title: "Sem módulo",
          description: "Aulas sem módulo definido",
          order_index: -1,
          lessons: unassignedLessons,
        },
        ...modulesWithLessons,
      ]
    : modulesWithLessons

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-4">
        <Link href="/admin/cursos">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Cursos
          </Button>
        </Link>
      </div>

      {/* Gerenciador de aulas */}
      <LessonManager
        courseId={course.id}
        courseTitle={course.title}
        modules={modulesPayload}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando aulas...</p>
      </div>
    </div>
  )
}

export default async function ManageLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] p-6">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<LoadingState />}>
          <LessonsContent courseId={id} />
        </Suspense>
      </div>
    </div>
  )
}
