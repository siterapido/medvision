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
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Users,
  Video,
  Bell,
  CheckCircle2,
  Clock,
  Radio,
  Calendar,
  TrendingUp,
  AlertCircle,
  UserPlus,
} from "lucide-react"
import { formatDistanceToNow, startOfDay, startOfWeek, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function AdminPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Calculate date ranges for new users
  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const weekStart = startOfWeek(now, { locale: ptBR }).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Fetch comprehensive stats
  const [
    coursesResult,
    coursesPublishedResult,
    usersResult,
    usersTodayResult,
    usersWeekResult,
    usersMonthResult,
    lessonsResult,
    materialsResult,
    materialsAvailableResult,
    livesResult,
    livesScheduledResult,
    livesLiveResult,
    notificationsResult,
    notificationsSuccessResult,
    notificationsFailedResult,
  ] = await Promise.all([
    // Courses
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true),

    // Users - Total
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    // Users - Today
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),

    // Users - This Week
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekStart),

    // Users - This Month
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),

    // Lessons
    supabase.from("lessons").select("*", { count: "exact", head: true }),

    // Materials
    supabase.from("materials").select("*", { count: "exact", head: true }),
    supabase.from("materials").select("*", { count: "exact", head: true }).eq("is_available", true),

    // Lives
    supabase.from("live_events").select("*", { count: "exact", head: true }),
    supabase.from("live_events").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("live_events").select("*", { count: "exact", head: true }).eq("status", "live"),

    // Notifications
    supabase.from("notification_logs").select("*", { count: "exact", head: true }),
    supabase.from("notification_logs").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("notification_logs").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ])

  const totalCourses = coursesResult.count || 0
  const publishedCourses = coursesPublishedResult.count || 0
  const draftCourses = totalCourses - publishedCourses
  const totalUsers = usersResult.count || 0
  const newUsersToday = usersTodayResult.count || 0
  const newUsersWeek = usersWeekResult.count || 0
  const newUsersMonth = usersMonthResult.count || 0
  const totalLessons = lessonsResult.count || 0
  const totalMaterials = materialsResult.count || 0
  const availableMaterials = materialsAvailableResult.count || 0
  const totalLives = livesResult.count || 0
  const scheduledLives = livesScheduledResult.count || 0
  const liveLives = livesLiveResult.count || 0
  const totalNotifications = notificationsResult.count || 0
  const successNotifications = notificationsSuccessResult.count || 0
  const failedNotifications = notificationsFailedResult.count || 0

  // Fetch recent data
  const [recentCourses, recentMaterials, upcomingLives, recentNotifications, recentUsers] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, created_at, is_published")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("materials")
      .select("id, title, created_at, is_available")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("live_events")
      .select("id, title, start_at, status")
      .in("status", ["scheduled", "live"])
      .order("start_at", { ascending: true })
      .limit(5),

    supabase
      .from("notification_logs")
      .select(`
        id,
        sent_at,
        status,
        profiles (name),
        notification_templates (name)
      `)
      .order("sent_at", { ascending: false })
      .limit(10),

    supabase
      .from("profiles")
      .select("id, name, email, created_at, plan_type, subscription_status")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return (
    <div className="w-full h-full flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <section className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Acompanhe o desempenho e atividades da plataforma
          </p>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {/* Cursos */}
        <Card className="border border-[#24324F] bg-[#16243F] shadow-lg shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6">
            <div className="rounded-xl sm:rounded-2xl bg-[#0891b2]/10 p-2.5 sm:p-3 text-[#06b6d4] ring-1 ring-[#0891b2]/20 flex-shrink-0">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">Cursos</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalCourses}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 text-xs font-medium">
                <span className="text-[#10b981]">{publishedCourses} publicados</span>
                {draftCourses > 0 && <span className="text-slate-500">• {draftCourses} rascunhos</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materiais */}
        <Card className="border border-[#24324F] bg-[#16243F] shadow-lg shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6">
            <div className="rounded-xl sm:rounded-2xl bg-purple-500/20 p-2.5 sm:p-3 text-purple-400 ring-1 ring-purple-500/30 flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">Materiais</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalMaterials}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 text-xs font-medium">
                <span className="text-[#10b981]">{availableMaterials} disponíveis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lives */}
        <Card className="border border-[#24324F] bg-[#16243F] shadow-lg shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6">
            <div className="rounded-xl sm:rounded-2xl bg-red-500/20 p-2.5 sm:p-3 text-red-400 ring-1 ring-red-500/30 flex-shrink-0">
              <Video className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">Lives</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalLives}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 text-xs">
                {liveLives > 0 && <span className="text-red-400">{liveLives} ao vivo</span>}
                {scheduledLives > 0 && <span className="text-amber-400">{scheduledLives} agendadas</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border border-[#24324F] bg-[#16243F] shadow-lg shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6">
            <div className="rounded-xl sm:rounded-2xl bg-emerald-500/20 p-2.5 sm:p-3 text-emerald-400 ring-1 ring-emerald-500/30 flex-shrink-0">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">Notificações</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalNotifications}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 text-xs">
                <span className="text-green-400">{successNotifications} enviadas</span>
                {failedNotifications > 0 && <span className="text-red-400">• {failedNotifications} falhas</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Secondary Stats */}
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-[#24324F] bg-[#131D37]">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="rounded-lg sm:rounded-xl bg-blue-500/20 p-2 sm:p-2.5 text-blue-400 flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-400">Usuários</p>
              <p className="text-lg sm:text-xl font-semibold text-white">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="rounded-lg sm:rounded-xl bg-indigo-500/20 p-2 sm:p-2.5 text-indigo-400 flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-400">Aulas</p>
              <p className="text-lg sm:text-xl font-semibold text-white">{totalLessons}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="rounded-lg sm:rounded-xl bg-amber-500/20 p-2 sm:p-2.5 text-amber-400 flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-400">Lives Agendadas</p>
              <p className="text-lg sm:text-xl font-semibold text-white">{scheduledLives}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* New Users Section */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* New Users Stats */}
        <Card className="border border-[#24324F] bg-[#131D37] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              Novos Usuários
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-400">
              Estatísticas de cadastros recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F]">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Hoje</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{newUsersToday}</p>
              </div>
              <div className="rounded-lg bg-green-500/20 p-2 text-green-400">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F]">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Esta Semana</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{newUsersWeek}</p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F]">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Este Mês</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{newUsersMonth}</p>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users List */}
        <Card className="border border-[#24324F] bg-[#16243F] lg:col-span-2">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-white">Usuários Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Últimos usuários cadastrados na plataforma
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
              <Link href="/admin/usuarios">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.data && recentUsers.data.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentUsers.data.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F] hover:bg-[#131D37] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-blue-500/20 p-1.5 text-blue-400 flex-shrink-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {user.name || user.email || "Usuário sem nome"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                            {user.email && (
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                {user.email}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(user.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {user.plan_type && user.plan_type !== "free" && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                {user.plan_type === "monthly" ? "Mensal" : user.plan_type === "annual" ? "Anual" : user.plan_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                Nenhum usuário encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity & Quick Actions */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Courses */}
        <Card className="border border-[#24324F] bg-[#16243F]">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-white">Cursos Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Últimos cursos criados ou atualizados
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
              <Link href="/admin/cursos">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCourses.data && recentCourses.data.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentCourses.data.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F] hover:bg-[#131D37] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">
                        {course.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(course.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {course.is_published ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            Rascunho
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                Nenhum curso encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Materials */}
        <Card className="border border-[#24324F] bg-[#16243F]">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-white">Materiais Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Últimos materiais adicionados
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
              <Link href="/admin/materiais">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMaterials.data && recentMaterials.data.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentMaterials.data.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F] hover:bg-[#131D37] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">
                        {material.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(material.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {material.is_available ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            Indisponível
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                Nenhum material encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Lives */}
        <Card className="border border-[#24324F] bg-[#16243F]">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-white">Próximas Lives</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Lives agendadas e ao vivo
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
              <Link href="/admin/lives">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingLives.data && upcomingLives.data.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {upcomingLives.data.map((live: any) => (
                  <div
                    key={live.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F] hover:bg-[#131D37] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">
                        {live.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        {live.start_at && (
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(live.start_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        )}
                        {live.status === "live" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <Radio className="h-3 w-3 animate-pulse" />
                            Ao vivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            <Calendar className="h-3 w-3" />
                            Agendada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                Nenhuma live agendada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="border border-[#24324F] bg-[#16243F]">
          <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg text-white">Notificações Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Últimas notificações enviadas
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
              <Link href="/admin/notifications">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentNotifications.data && recentNotifications.data.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentNotifications.data.slice(0, 5).map((notification: any) => {
                  const template = Array.isArray(notification.notification_templates)
                    ? notification.notification_templates[0]
                    : notification.notification_templates
                  const templateName = template?.name || "Notificação"

                  return (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-[#0F192F] hover:bg-[#131D37] transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs sm:text-sm font-medium text-white truncate">
                          {templateName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                          {notification.sent_at && (
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(notification.sent_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          )}
                          {notification.status === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Enviada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              Falhou
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                Nenhuma notificação encontrada
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
