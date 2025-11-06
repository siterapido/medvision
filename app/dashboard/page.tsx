import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Bot, GraduationCap, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user stats
  const [chatMessagesResult, coursesProgressResult, activitiesResult, subscriptionResult] =
    await Promise.all([
      // Count chat messages from user
      supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user"),

      // Count courses in progress
      supabase.from("user_courses").select("*", { count: "exact", head: true }).eq("user_id", user.id).gt("progress", 0).lt("progress", 100),

      // Get recent activities
      supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4),

      // Get user subscription
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
    ])

  const totalMessages = chatMessagesResult.count || 0
  const coursesInProgress = coursesProgressResult.count || 0
  const recentActivities = activitiesResult.data || []
  const subscription = subscriptionResult.data

  // Calculate messages remaining (Free plan: 10/day, Pro: unlimited)
  const messageLimit = subscription?.plan === "monthly" || subscription?.plan === "annual" ? "Ilimitado" : "10"
  const messagesRemaining = subscription?.plan === "monthly" || subscription?.plan === "annual" ? "∞" : String(Math.max(0, 10 - (totalMessages % 10)))

  const stats = [
    {
      title: "Mensagens enviadas",
      value: String(totalMessages),
      description: "Total de interações com IA",
      icon: MessageSquare,
    },
    {
      title: "Mensagens restantes",
      value: messagesRemaining,
      description: `Limite diário: ${messageLimit}`,
      icon: Bot,
    },
    {
      title: "Cursos em andamento",
      value: String(coursesInProgress).padStart(2, "0"),
      description: "Continue seu aprendizado",
      icon: GraduationCap,
    },
  ]
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="relative overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <CardHeader className="px-6">
            <CardTitle className="text-3xl font-semibold">Central de Inteligência Clínica</CardTitle>
            <CardDescription className="text-slate-400">
              Combine recomendações do Odonto GPT com sua agenda para acelerar diagnósticos e decisões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Conversas ativas</p>
                <p className="text-2xl font-semibold text-white">3 sessões</p>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 backdrop-blur">
                <p className="text-sm text-slate-300">Sugestão do modelo</p>
                <p className="text-2xl font-semibold text-white">Revisar protocolo de enxerto</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="sm" className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/chat">
                  Abrir chat
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700">
                Adicionar caso clínico
              </Button>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.25),_transparent_70%)] sm:block" />
        </Card>

        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">
              {subscription?.plan === "monthly"
                ? "Plano Mensal Pro"
                : subscription?.plan === "annual"
                  ? "Plano Anual Pro"
                  : "Plano Free"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {subscription?.plan === "monthly" || subscription?.plan === "annual"
                ? "Mensagens ilimitadas · Recursos premium"
                : "10 mensagens/dia · Recursos básicos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-slate-300">
              {subscription?.plan === "monthly" || subscription?.plan === "annual" ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Mensagens ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Todos os cursos disponíveis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Suporte prioritário
                  </li>
                </>
              ) : (
                <>
                  <li>Suporte clínico em português</li>
                  <li>Modelos generalistas baseados em guidelines</li>
                  <li>Histórico de conversas por 30 dias</li>
                </>
              )}
            </ul>
            {(!subscription || subscription.status !== "active") && (
              <>
                <Button asChild className="w-full rounded-xl">
                  <Link href="/dashboard/assinatura">Ativar Plano Pro</Link>
                </Button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  + Mensagens ilimitadas e recursos premium
                </p>
              </>
            )}
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-slate-100">Atividade recente</CardTitle>
              {recentActivities.length > 0 && (
                <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                  Tempo real
                </Badge>
              )}
            </div>
            <CardDescription className="text-slate-400">Suas ações e interações com o Odonto GPT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <p>Nenhuma atividade registrada ainda.</p>
                <p className="mt-2">Comece a usar o chat para ver suas atividades aqui.</p>
              </div>
            ) : (
              recentActivities.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color || "bg-primary"}`}></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Começar agora</CardTitle>
            <CardDescription className="text-slate-400">Ações rápidas para acelerar seu trabalho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full rounded-xl">
              <Link href="/dashboard/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Iniciar chat com IA
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-700">
              <Link href="/dashboard/cursos">
                <GraduationCap className="mr-2 h-4 w-4" />
                Ver cursos disponíveis
              </Link>
            </Button>
            {(!subscription || subscription.status !== "active") && (
              <Button asChild variant="secondary" className="w-full rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600">
                <Link href="/dashboard/assinatura">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Upgrade para Pro
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
