import Link from "next/link"
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan"
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task"
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, Bot, GraduationCap, MessageSquare, ShieldCheck, Star } from "lucide-react"

const stats = [
  { title: "Conversas de IA", value: "47", description: "+12% vs última semana", icon: MessageSquare },
  { title: "Mensagens restantes", value: "13", description: "Limite diário do plano Free", icon: Bot },
  { title: "Cursos em andamento", value: "04", description: "Mantenha sua curva de aprendizado", icon: GraduationCap },
  { title: "Avaliações 5★", value: "32", description: "Pacientes satisfeitos este mês", icon: Star },
]

const activity = [
  { label: "Revisou protocolo de implantes", time: "há 18 min", color: "bg-primary" },
  { label: "Chat IA sugeriu nova conduta", time: "há 2 h", color: "bg-accent" },
  { label: "Curso de Endodontia 75%", time: "ontem", color: "bg-secondary" },
  { label: "Certificado de Laserterapia", time: "3 dias", color: "bg-emerald-400" },
]

const learningPaths = [
  {
    title: "Ortodontia Digital",
    description: "Planejamento com escaneamento intraoral e IA",
    progress: 62,
    lessons: 14,
  },
  {
    title: "Sedação Consciente",
    description: "Protocolos seguros para pacientes ansiosos",
    progress: 28,
    lessons: 9,
  },
]

export default function DashboardPage() {
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

        <Plan>
          <PlanHeader>
            <div>
              <PlanTitle>Plano Free</PlanTitle>
              <PlanDescription>10 mensagens/dia · 2 dispositivos conectados</PlanDescription>
            </div>
            <PlanAction>
              <PlanTrigger />
            </PlanAction>
          </PlanHeader>
          <PlanContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Suporte clínico em português</li>
              <li>Modelos generalistas baseados em guidelines</li>
              <li>Histórico de conversas por 30 dias</li>
            </ul>
          </PlanContent>
          <PlanFooter className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/assinatura">Ativar Plano Pro</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">+ Mensagens, segundas opiniões e upload de imagens</p>
          </PlanFooter>
        </Plan>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, description, icon: Icon }) => (
          <Card key={title} className="border border-border/70 bg-white/90">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-emerald-500">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Atividade recente</CardTitle>
              <Badge variant="outline">Tempo real</Badge>
            </div>
            <CardDescription>Resumo do que aconteceu com você e com o Odonto GPT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}></span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary">
                  Ver detalhes
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Assistente Proativo</CardTitle>
            <CardDescription>Sugestões geradas pela IA conforme suas conversas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Task>
              <TaskTrigger title="Sugestões inteligentes" />
              <TaskContent>
                <TaskItem>
                  Revisite o caso "Paciente 042" para anexar radiografia periapical.
                  <TaskItemFile className="ml-2">rx-042.png</TaskItemFile>
                </TaskItem>
                <TaskItem>
                  Ative o modo especialista para liberar análise de imagens.
                </TaskItem>
                <TaskItem>
                  Agende revisão do curso de Implantodontia para consolidar conhecimento.
                </TaskItem>
              </TaskContent>
            </Task>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {learningPaths.map((path) => (
          <Card key={path.title} className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {path.title}
              </CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                  <span>{path.lessons} aulas</span>
                  <span>{path.progress}%</span>
                </div>
                <Progress value={path.progress} className="h-2" />
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/cursos">Continuar trilha</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Insights rápidos do chat</CardTitle>
            <CardDescription>Sua IA priorizou estes tópicos para revisar hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-primary">Conduta clínica</p>
              <p className="text-lg font-semibold text-slate-900">Atualizar protocolo de peri-implantite</p>
              <p className="text-sm text-muted-foreground">Baseado em evidências de 2025 · guideline EAO.</p>
            </div>
            <div className="rounded-2xl border border-accent/40 bg-accent/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-900/70">Educação</p>
              <p className="text-lg font-semibold text-slate-900">Assistir aula de Sedação Digital</p>
              <p className="text-sm text-slate-700">IA detectou 3 dúvidas recorrentes sobre o tema.</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/chat">Começar sessão guiada</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
