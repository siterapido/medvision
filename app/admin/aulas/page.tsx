import { Suspense } from "react"
import Link from "next/link"
import { format, formatDistanceToNowStrict } from "date-fns"
import ptBR from "date-fns/locale/pt-BR"
import { ArrowUpRight, BookOpen, CalendarDays, Loader2, Users, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Gerenciar Aulas | Admin",
  description: "Central de aulas conectada ao Supabase para manter o conteúdo alinhado ao painel administrativo.",
}

type LessonWithCourse = {
  id: string
  title: string
  module_title: string | null
  order_index: number | null
  duration_minutes: number | null
  available_at: string | null
  video_url: string | null
  course: {
    id: string
    title: string
  } | null
}

async function LessonsContent() {
  const supabase = await createClient()

  const { data: lessonsData, error } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      module_title,
      order_index,
      duration_minutes,
      available_at,
      video_url,
      course:course_id (id, title)
    `)

  if (error) {
    console.error("Erro ao buscar aulas:", error)
    return (
      <Card className="bg-[#131D37] border border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Erro ao carregar aulas</CardTitle>
          <CardDescription className="text-slate-400">
            Não foi possível carregar o catálogo de aulas. Confira as políticas do Supabase e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const lessons = lessonsData || []
  const now = new Date()
  const sortedLessons = [...lessons].sort((a, b) => {
    const courseA = a.course?.title || ""
    const courseB = b.course?.title || ""
    if (courseA !== courseB) {
      return courseA.localeCompare(courseB)
    }
    const orderA = a.order_index ?? 0
    const orderB = b.order_index ?? 0
    return orderA - orderB
  }) as LessonWithCourse[]

  const uniqueCourseIds = new Set<string>()
  let videoCount = 0
  let upcomingCount = 0

  sortedLessons.forEach((lesson) => {
    if (lesson.course?.id) {
      uniqueCourseIds.add(lesson.course.id)
    }
    if (lesson.video_url) {
      videoCount += 1
    }
    if (lesson.available_at) {
      const lessonDate = new Date(lesson.available_at)
      if (!Number.isNaN(lessonDate.getTime()) && lessonDate > now) {
        upcomingCount += 1
      }
    }
  })

  const stats = [
    {
      title: "Aulas cadastradas",
      description: "Total de aulas sincronizadas",
      value: sortedLessons.length,
      icon: BookOpen,
    },
    {
      title: "Cursos representados",
      description: "Com aulas ativas",
      value: uniqueCourseIds.size,
      icon: Users,
    },
    {
      title: "Vídeos carregados",
      description: "Aulas com conteúdo multimídia",
      value: videoCount,
      icon: Video,
    },
    {
      title: "Aulas agendadas",
      description: "Datas futuras programadas",
      value: upcomingCount,
      icon: CalendarDays,
    },
  ]

  const formatLessonDuration = (minutes: number | null) => {
    if (!minutes || minutes <= 0) {
      return "Sem duração"
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`
    }
    if (hours > 0) {
      return `${hours}h`
    }
    return `${mins}min`
  }

  const formatAvailabilityLabel = (target: Date | null) => {
    if (!target || Number.isNaN(target.getTime())) {
      return "Disponível agora"
    }
    const distance = formatDistanceToNowStrict(target, {
      addSuffix: true,
      locale: ptBR,
    })
    const prefix = target > now ? "Agendado" : "Publicado"
    return `${prefix} ${distance}`
  }

  const formatAvailabilityTitle = (target: Date | null) => {
    if (!target || Number.isNaN(target.getTime())) {
      return undefined
    }
    return format(target, "d 'de' MMM 'às' HH:mm", {
      locale: ptBR,
    })
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map(({ title, description, value, icon: Icon }) => (
            <Card
              key={title}
              className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg"
            >
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {title}
                  </p>
                  <div className="rounded-2xl bg-white/10 p-2 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="text-sm text-slate-400">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border border-slate-800 bg-[#131D37]">
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-white text-2xl">Catálogo de aulas</CardTitle>
              <CardDescription className="text-slate-400">
                Todas as aulas sincronizadas com o Supabase. Use o botão abaixo para gerenciar o curso relacionado.
              </CardDescription>
            </div>
            <Button asChild variant="blue" size="sm">
              <Link href="/admin/cursos" className="flex items-center gap-1 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                Ir para cursos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-slate-700 rounded-2xl bg-slate-900/40 p-10 text-center">
              <p className="text-lg font-semibold text-white">Ainda não há aulas cadastradas</p>
              <p className="text-sm text-slate-400">
                Cadastre um curso para começar a estruturar módulos e aulas e, em seguida, acesse a página de um curso específico para adicionar o conteúdo.
              </p>
              <Button asChild variant="cta" size="sm">
                <Link href="/admin/cursos">Criar primeira aula</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-auto rounded-3xl border border-slate-800 bg-slate-950/40">
              <Table className="min-w-full text-sm text-slate-300">
                <TableHeader>
                  <TableRow className="bg-slate-900/60 text-slate-400">
                    <TableHead>Aula</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Disponibilidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLessons.map((lesson) => {
                    const moduleLabel = lesson.module_title?.trim() || "Sem módulo"
                    const availabilityDate = lesson.available_at
                      ? new Date(lesson.available_at)
                      : null
                    const availabilityText = formatAvailabilityLabel(availabilityDate)
                    const availabilityTitle = formatAvailabilityTitle(availabilityDate)
                    const courseTitle = lesson.course?.title || "Curso removido"
                    const coursePath = lesson.course?.id
                      ? `/admin/cursos/${lesson.course.id}/aulas`
                      : "/admin/cursos"

                    return (
                      <TableRow
                        key={lesson.id}
                        className="border-b border-slate-800 bg-slate-950/40 hover:bg-slate-900/60"
                      >
                        <TableCell className="space-y-1">
                          <p className="text-base font-semibold text-white">{lesson.title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>#{lesson.order_index ?? "-"}</span>
                            <Badge variant="outline" className="border-slate-700 bg-slate-900/40 text-slate-200">
                              {moduleLabel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-slate-100">{courseTitle}</p>
                          {lesson.course?.id && (
                            <p className="text-[11px] text-slate-500">{lesson.course.id}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-200">{formatLessonDuration(lesson.duration_minutes)}</TableCell>
                        <TableCell>
                          <p
                            className={`text-sm font-medium ${
                              lesson.available_at && availabilityDate && availabilityDate > now
                                ? "text-emerald-300"
                                : "text-slate-300"
                            }`}
                            title={availabilityTitle}
                          >
                            {availabilityText}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-white"
                          >
                            <Link href={coursePath} className="flex items-center gap-1">
                              <span>Abrir curso</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-sm text-slate-400">Carregando dados das aulas...</p>
      </div>
    </div>
  )
}

export default function AdminLessonsPage() {
  return (
    <div className="min-h-screen w-full p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Administração
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Gerenciar Aulas</h1>
            <p className="text-slate-400">
              Centralize o acompanhamento das aulas, timelines e relacionamentos com cursos diretamente via Supabase.
            </p>
          </div>
        </header>
        <Suspense fallback={<LoadingState />}>
          <LessonsContent />
        </Suspense>
      </div>
    </div>
  )
}
