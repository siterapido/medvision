import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CourseWorkspace, type CourseRowWithLessons } from "@/components/admin/course-workspace"

export default async function NovoCursoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: coursesData }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase
      .from("courses")
      .select(
        `id, title, description, duration, lessons_count, thumbnail_url, updated_at,
         lessons ( id, title, module_title, duration_minutes, video_url, materials, available_at )`
      )
      .order("updated_at", { ascending: false })
      .limit(6),
  ])

  const adminName = profile?.name || user.email?.split("@")[0] || "Admin"

  const existingCourses: CourseRowWithLessons[] =
    coursesData?.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      duration: course.duration,
      lessons_count: course.lessons_count,
      thumbnail_url: course.thumbnail_url,
      updated_at: course.updated_at,
      lessons: (course.lessons as CourseRowWithLessons["lessons"]) ?? [],
    })) ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cadastrar novo curso</h1>
          <p className="text-sm text-slate-600">Fluxo guiado em etapas com revisão antes de publicar.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
          <Link href="/admin">Voltar ao painel</Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-slate-900">Fluxo de cadastro</CardTitle>
          <CardDescription className="text-slate-600">Preencha as etapas como em um acordeão.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* O CourseWorkspace já implementa as três etapas com colapsáveis internos, atuando como acordeão */}
          <div className="p-6">
            <CourseWorkspace adminName={adminName} existingCourses={existingCourses} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
