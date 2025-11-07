import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/server"
import { type CourseRowWithLessons } from "@/components/admin/course-workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, UploadCloud, Video } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [{ data: profile }, { data: coursesData }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase
      .from("courses")
      .select(
        `
        id,
        title,
        description,
        lessons_count,
        thumbnail_url,
        updated_at,
        lessons (
          id,
          title,
          module_title,
          duration_minutes,
          video_url,
          materials,
          available_at
        )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(6),
  ])

  const adminName = profile?.name || user.email?.split("@")[0] || "Admin"

  const normalizedCourses: CourseRowWithLessons[] =
    coursesData?.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      lessons_count: course.lessons_count,
      thumbnail_url: course.thumbnail_url,
      updated_at: course.updated_at,
      lessons: (course.lessons as CourseRowWithLessons["lessons"]) ?? [],
    })) ?? []

  const lessonsTotal = normalizedCourses.reduce((total, course) => total + (course.lessons_count ?? 0), 0)
  const materialsTotal = normalizedCourses.reduce(
    (total, course) =>
      total +
      (course.lessons?.reduce((lessonTotal, lesson) => lessonTotal + (lesson.materials?.length ?? 0), 0) ?? 0),
    0
  )
  const lastUpdatedText =
    normalizedCourses[0]?.updated_at
      ? formatDistanceToNow(new Date(normalizedCourses[0].updated_at!), { addSuffix: true, locale: ptBR })
      : "sem registros"

  const statCards = [
    {
      label: "Cursos conectados",
      value: normalizedCourses.length.toString().padStart(2, "0"),
      helper: "Tudo pronto para o catálogo",
      icon: Layers,
    },
    {
      label: "Aulas roteirizadas",
      value: lessonsTotal,
      helper: "+ vídeos e notas",
      icon: Video,
    },
    {
      label: "Materiais anexados",
      value: materialsTotal,
      helper: "PDFs, checklists e links",
      icon: UploadCloud,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-0">
      <Card className="relative overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 text-slate-900 shadow-lg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#06b6d4]/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#0891b2]/6 rounded-full blur-3xl" />
        </div>
        <CardContent className="relative z-10 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Badge className="border-[#0891b2]/30 bg-[#0891b2]/10 text-[#0891b2]">Central de cursos</Badge>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  {adminName}, publique cursos completos em poucos minutos.
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
                  Tudo que você cadastrar aqui sincroniza automaticamente com a área de cursos, cards do dashboard e player do aluno.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white font-semibold hover:from-[#0e7490] hover:to-[#0891b2] shadow-lg">
                  <Link href="/admin/cursos/novo">Nova trilha guiada</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  <Link href="/dashboard/cursos">Ver catálogo público</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  Importar roteiro (CSV)
                </Button>
              </div>
            </div>
            <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-700 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Cursos ativos</span>
                <strong className="text-2xl text-[#0891b2]">
                  {normalizedCourses.length.toString().padStart(2, "0")}
                </strong>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Aulas no catálogo</span>
                <strong className="text-2xl text-[#0891b2]">{lessonsTotal}</strong>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Última atualização</span>
                <strong className="text-sm text-slate-900">{lastUpdatedText}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="rounded-xl border border-slate-300 bg-white hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center gap-4 px-6 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0891b2] to-[#06b6d4] border border-[#0891b2]/20">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-600">{helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-300 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-900 font-bold">Checklist de publicação</CardTitle>
          <CardDescription className="text-slate-600">
            Garanta que todo curso novo já esteja alinhado com a experiência da área de cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white text-xs font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-semibold text-slate-900">Roteiro do curso</p>
                <p className="mt-1 text-xs text-slate-600">
                  Estruture título, promessa, especialista e tags para ser encontrado nas coleções.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white text-xs font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-semibold text-slate-900">Aulas e vídeos</p>
                <p className="mt-1 text-xs text-slate-600">
                  Cada aula precisa de duração, link e resumo. A liberação define o cronograma.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white text-xs font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-semibold text-slate-900">Materiais e anexos</p>
                <p className="mt-1 text-xs text-slate-600">
                  Suba checklists, templates e PDFs por aula para liberar junto com o vídeo.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cadastro agora acontece na página /admin/cursos/novo */}
    </div>
  )
}
