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
  User,
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

  // Helper function para query base de leads do pipeline (mesmos filtros)
  const pipelineLeadsQuery = () => supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .neq("role", "admin")
    .neq("role", "vendedor")
    .is("deleted_at", null)
    .or("trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null")

  // Fetch comprehensive stats
  const [
    coursesResult,
    coursesPublishedResult,
    usersResult,
    usersAllResult,
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

    // Users - Leads do Pipeline (mesmos filtros do pipeline)
    pipelineLeadsQuery(),

    // Users - Total (todos os perfis para referência)
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    // Users - Today (leads do pipeline criados hoje)
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .or("trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null")
      .gte("created_at", todayStart),

    // Users - This Week (leads do pipeline criados esta semana)
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .or("trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null")
      .gte("created_at", weekStart),

    // Users - This Month (leads do pipeline criados este mês)
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .or("trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null")
      .gte("created_at", monthStart),

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
  const pipelineLeads = usersResult.count || 0  // Leads ativos no pipeline (mesmos filtros)
  const totalProfiles = usersAllResult.count || 0  // Total de perfis cadastrados
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
      .neq("role", "admin")
      .neq("role", "vendedor")
      .is("deleted_at", null)
      .or("trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o desempenho e atividades da plataforma em tempo real.
        </p>
      </section>

      {/* Main Stats Grid */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cursos */}
        <Card className="border-border bg-card shadow-sm hover:ring-1 hover:ring-primary/20 transition-all">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cursos</p>
              <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium">
                <span className="text-success">{publishedCourses} publicados</span>
                {draftCourses > 0 && <span className="text-muted-foreground">• {draftCourses} rascunhos</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materiais */}
        <Card className="border-border bg-card shadow-sm hover:ring-1 hover:ring-primary/20 transition-all">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Materiais</p>
              <p className="text-2xl font-bold text-foreground">{totalMaterials}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium">
                <span className="text-success">{availableMaterials} disponíveis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lives */}
        <Card className="border-border bg-card shadow-sm hover:ring-1 hover:ring-primary/20 transition-all">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lives</p>
              <p className="text-2xl font-bold text-foreground">{totalLives}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium">
                {liveLives > 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    {liveLives} ao vivo
                  </span>
                ) : (
                  <span className="text-muted-foreground">{scheduledLives} agendadas</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border-border bg-card shadow-sm hover:ring-1 hover:ring-primary/20 transition-all">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notificações</p>
              <p className="text-2xl font-bold text-foreground">{totalNotifications}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium">
                <span className="text-success">{successNotifications} enviadas</span>
                {failedNotifications > 0 && <span className="text-destructive">• {failedNotifications} falhas</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Secondary Stats */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Leads Pipeline</p>
              <p className="text-base font-bold text-foreground">{pipelineLeads}</p>
              <p className="text-[10px] text-muted-foreground">{totalProfiles} perfis total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Aulas</p>
              <p className="text-base font-bold text-foreground">{totalLessons}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card col-span-2 md:col-span-1">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Próximas Lives</p>
              <p className="text-base font-bold text-foreground">{scheduledLives}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Lists Section */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Users List */}
        <Card className="border-border bg-card flex flex-col h-[450px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold">Leads Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos leads ativos no pipeline.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/admin/pipeline">
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-0">
            {recentUsers.data && recentUsers.data.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentUsers.data.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name || user.email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest">
                Sem dados recentes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 grid-cols-1 overflow-hidden">
          {/* Recent Courses */}
          <Card className="border-border bg-card flex flex-col h-[218px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cursos Recentes</CardTitle>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                <Link href="/admin/cursos">Ver tudo</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-0">
              <div className="space-y-1">
                {recentCourses.data?.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <p className="text-sm font-medium text-foreground truncate flex-1">{course.title}</p>
                    {course.is_published ? (
                      <span className="bg-success/10 text-success text-[10px] px-1.5 py-0.5 rounded ml-2">Ativo</span>
                    ) : (
                      <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded ml-2">Rascunho</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Lives Quick View */}
          <Card className="border-border bg-card flex flex-col h-[208px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximas Lives</CardTitle>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                <Link href="/admin/lives">Agenda</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-0">
              <div className="space-y-1">
                {upcomingLives.data?.length ? (
                  upcomingLives.data.map((live: any) => (
                    <div key={live.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{live.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {live.start_at ? formatDistanceToNow(new Date(live.start_at), { addSuffix: true, locale: ptBR }) : 'Pendente'}
                        </p>
                      </div>
                      {live.status === 'live' && <Radio className="h-3 w-3 text-destructive animate-pulse ml-2" />}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-50">
                    Agenda vazia
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
