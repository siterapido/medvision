import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/server"
import { CourseWorkspace, type CourseRowWithLessons } from "@/components/admin/course-workspace"
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
        duration,
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
      duration: course.duration,
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
      <Card className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#0b1a2f] via-[#061220] to-[#040a16]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_60%)]" />
        <CardContent className="relative px-6 py-10 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Badge className="border-cyan-400/40 bg-cyan-400/10 text-cyan-100">Nova central de cursos</Badge>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {adminName}, publique cursos completos em poucos minutos.
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-300">
                  Tudo que você cadastrar aqui sincroniza automaticamente com a área de cursos, cards do dashboard e player do aluno.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">Nova trilha guiada</Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl border-white/30 text-white hover:bg-white/10"
                >
                  <Link href="/dashboard/cursos">Ver catálogo público</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                >
                  Importar roteiro (CSV)
                </Button>
              </div>
            </div>
            <div className="grid w-full max-w-sm gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Cursos ativos</span>
                <strong className="text-xl text-white">
                  {normalizedCourses.length.toString().padStart(2, "0")}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Aulas no catálogo</span>
                <strong className="text-xl text-white">{lessonsTotal}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Última atualização</span>
                <strong className="text-sm text-white">{lastUpdatedText}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="rounded-2xl border-white/10 bg-white/5">
            <CardContent className="flex items-center gap-4 px-6 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="text-xs text-slate-400">{helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-white/10 bg-white/5">
        <CardHeader className="pb-0">
          <CardTitle className="text-white">Checklist de publicação</CardTitle>
          <CardDescription className="text-slate-400">
            Garanta que todo curso novo já esteja alinhado com a experiência da área de cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#070f1e] p-4">
            <p className="font-semibold text-white">1. Roteiro do curso</p>
            <p className="mt-1 text-xs text-slate-400">
              Estruture título, promessa, especialista e tags para ser encontrado nas coleções.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#070f1e] p-4">
            <p className="font-semibold text-white">2. Aulas e vídeos</p>
            <p className="mt-1 text-xs text-slate-400">
              Cada aula precisa de duração, link e resumo. A liberação define o cronograma.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#070f1e] p-4">
            <p className="font-semibold text-white">3. Materiais e anexos</p>
            <p className="mt-1 text-xs text-slate-400">
              Suba checklists, templates e PDFs por aula para liberar junto com o vídeo.
            </p>
          </div>
        </CardContent>
      </Card>

      <CourseWorkspace adminName={adminName} existingCourses={normalizedCourses} />
    </div>
  )
}
