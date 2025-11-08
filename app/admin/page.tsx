import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, BookOpen, Users, ArrowUpRight } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch admin stats
  const [coursesResult, usersResult, lessonsResult] = await Promise.all([
    // Count total courses
    supabase.from("courses").select("*", { count: "exact", head: true }),

    // Count total users
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    // Count total lessons
    supabase.from("lessons").select("*", { count: "exact", head: true }),
  ])

  const totalCourses = coursesResult.count || 0
  const totalUsers = usersResult.count || 0
  const totalLessons = lessonsResult.count || 0

  const stats = [
    {
      title: "Cursos criados",
      value: String(totalCourses),
      description: "Total de cursos na plataforma",
      icon: BookOpen,
    },
    {
      title: "Usuários",
      value: String(totalUsers),
      description: "Total de usuários registrados",
      icon: Users,
    },
    {
      title: "Aulas",
      value: String(totalLessons),
      description: "Total de aulas criadas",
      icon: BarChart3,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Painel de Administração</h1>
          <p className="text-slate-400 mt-1">Gerencie cursos, aulas e usuários da plataforma</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(({ title, value, description, icon: Icon }) => (
          <Card key={title} className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-2xl bg-primary/20 p-3 text-primary ring-1 ring-primary/30">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-2xl font-semibold text-slate-100">{value}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Gerenciar Cursos</CardTitle>
            <CardDescription className="text-slate-400">
              Crie, edite e delete cursos da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl">
              <Link href="/admin/cursos">
                <BookOpen className="mr-2 h-4 w-4" />
                Ir para gerenciamento de cursos
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Gerenciar Usuários</CardTitle>
            <CardDescription className="text-slate-400">
              Visualize e gerencie os usuários da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Funcionalidade em desenvolvimento. Você pode criar novos usuários administradores via API.
            </p>
            <Button asChild variant="outline" className="w-full rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-700">
              <Link href="/api/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Documentação da API
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
