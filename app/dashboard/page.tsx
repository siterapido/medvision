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
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#0f192f] via-[#132442] to-[#0b172b] text-white shadow-xl">
          <CardHeader className="px-6">
            <CardTitle className="text-3xl font-semibold">Central de Inteligência Clínica</CardTitle>
            <CardDescription className="text-white/70">
              Combine recomendações do Odonto GPT com sua agenda para acelerar diagnósticos e decisões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
                <p className="text-sm text-white/70">Conversas ativas</p>
                <p className="text-2xl font-semibold text-white">3 sessões</p>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
                <p className="text-sm text-white/80">Sugestão do modelo</p>
                <p className="text-2xl font-semibold text-white">Revisar protocolo de enxerto</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="sm" className="gap-2 bg-white text-slate-900 hover:bg-primary hover:text-white">
                <Link href="/dashboard/chat">
                  Abrir chat
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Adicionar caso clínico
              </Button>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.35),_transparent_70%)] sm:block" />
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>
              {subscription?.plan === "monthly"
                ? "Plano Mensal Pro"
                : subscription?.plan === "annual"
                  ? "Plano Anual Pro"
                  : "Plano Free"}
            </CardTitle>
            <CardDescription>
              {subscription?.plan === "monthly" || subscription?.plan === "annual"
                ? "Mensagens ilimitadas · Recursos premium"
                : "10 mensagens/dia · Recursos básicos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
              {subscription?.plan === "monthly" || subscription?.plan === "annual" ? (
                <>
                  <li>✓ Mensagens ilimitadas</li>
                  <li>✓ Todos os cursos disponíveis</li>
                  <li>✓ Suporte prioritário</li>
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
                <Button asChild className="w-full">
                  <Link href="/dashboard/assinatura">Ativar Plano Pro</Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  + Mensagens ilimitadas e recursos premium
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(({ title, value, description, icon: Icon }) => (
          <Card key={title} className="border border-border/70 bg-white/90">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Atividade recente</CardTitle>
              {recentActivities.length > 0 && <Badge variant="outline">Tempo real</Badge>}
            </div>
            <CardDescription>Suas ações e interações com o Odonto GPT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p>Nenhuma atividade registrada ainda.</p>
                <p className="mt-2">Comece a usar o chat para ver suas atividades aqui.</p>
              </div>
            ) : (
              recentActivities.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color || "bg-primary"}`}></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
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

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Começar agora</CardTitle>
            <CardDescription>Ações rápidas para acelerar seu trabalho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Iniciar chat com IA
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/cursos">
                <GraduationCap className="mr-2 h-4 w-4" />
                Ver cursos disponíveis
              </Link>
            </Button>
            {(!subscription || subscription.status !== "active") && (
              <Button asChild variant="secondary" className="w-full">
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
