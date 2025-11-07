import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PlayCircle, Clock } from "lucide-react"

export default async function CursosPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all courses
  const { data: allCourses } = await supabase.from("courses").select("*").order("created_at", { ascending: true })

  // Fetch user progress for courses
  const { data: userProgress } = await supabase.from("user_courses").select("*").eq("user_id", user.id)

  // Merge courses with user progress
  const courses =
    allCourses?.map((course) => {
      const progress = userProgress?.find((p) => p.course_id === course.id)
      return {
        id: String(course.id),
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail_url || "/placeholder.svg?height=200&width=400",
        progress: progress?.progress || 0,
        lessons: course.lessons_count,
        duration: course.duration,
      }
    }) || []

  // Categorizar cursos
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100)
  const notStarted = courses.filter((c) => c.progress === 0)
  const completed = courses.filter((c) => c.progress === 100)

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Meus Cursos</h1>
        <p className="text-slate-600">Continue seu aprendizado e desenvolva suas habilidades</p>
      </div>

      {courses.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-lg text-slate-700 mb-2">Nenhum curso disponível no momento.</p>
          <p className="text-sm text-slate-600">
            Execute a migration <code className="bg-slate-200 px-2 py-1 rounded">002_courses_and_chat.sql</code> para
            adicionar cursos.
          </p>
        </div>
      ) : (
        <>
          {/* Cursos em Progresso */}
          {inProgress.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 px-6">Continue Assistindo</h2>
              <div className="px-6 overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {inProgress.map((course) => (
                    <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0 w-80 group">
                      <Card className="overflow-hidden border-slate-200 hover:border-primary transition-all hover:shadow-xl">
                        <div className="relative h-44 overflow-hidden bg-slate-900">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-white font-medium">{course.progress}% concluído</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{course.description}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {course.lessons} aulas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {course.duration}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cursos Novos */}
          {notStarted.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 px-6">Explore Novos Cursos</h2>
              <div className="px-6 overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {notStarted.map((course) => (
                    <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0 w-80 group">
                      <Card className="overflow-hidden border-slate-200 hover:border-primary transition-all hover:shadow-xl">
                        <div className="relative h-44 overflow-hidden bg-slate-900">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg">Novo</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{course.description}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {course.lessons} aulas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {course.duration}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cursos Concluídos */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 px-6">Cursos Concluídos</h2>
              <div className="px-6 overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {completed.map((course) => (
                    <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0 w-80 group">
                      <Card className="overflow-hidden border-slate-200 hover:border-primary transition-all hover:shadow-xl">
                        <div className="relative h-44 overflow-hidden bg-slate-900">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-600 text-white font-semibold shadow-lg">Concluído</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-white">
                          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{course.description}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {course.lessons} aulas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {course.duration}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
