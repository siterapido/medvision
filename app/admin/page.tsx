import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  GraduationCap,
  Layers,
  LucideIcon,
  MessageSquare,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react"

type CourseStatus = "Publicado" | "Em revisão" | "Rascunho"

type CoursePipelineRow = {
  id: string
  title: string
  lessons: number
  duration: string
  status: CourseStatus
  enrollment: number
  completion: number
  updatedAt: string | null
}

type QuickAction = {
  title: string
  description: string
  buttonLabel: string
  icon: LucideIcon
  highlight?: string
}

const CARD_BASE_STYLES =
  "border-white/10 bg-white/5 text-slate-100 backdrop-blur-xl shadow-[0_25px_80px_rgba(2,6,23,0.45)]"

const STATUS_BADGE_STYLES: Record<CourseStatus, string> = {
  Publicado: "border-emerald-400/50 bg-emerald-500/10 text-emerald-100",
  "Em revisão": "border-amber-400/50 bg-amber-400/10 text-amber-100",
  Rascunho: "border-slate-500/50 bg-slate-500/10 text-slate-200",
}

const SAMPLE_COURSES: CoursePipelineRow[] = [
  {
    id: "sample-1",
    title: "Implantodontia guiada em 3D",
    lessons: 18,
    duration: "14h",
    status: "Publicado",
    enrollment: 248,
    completion: 87,
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "sample-2",
    title: "Sedação consciente e controle da dor",
    lessons: 22,
    duration: "11h",
    status: "Em revisão",
    enrollment: 132,
    completion: 64,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "sample-3",
    title: "DTM e dor orofacial integrada",
    lessons: 16,
    duration: "9h",
    status: "Publicado",
    enrollment: 174,
    completion: 78,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "sample-4",
    title: "Estética ultrafina com IA clínica",
    lessons: 14,
    duration: "7h",
    status: "Rascunho",
    enrollment: 0,
    completion: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Lançar nova trilha premium",
    description: "Combine aulas gravadas, agendas ao vivo e automações de mentoria.",
    buttonLabel: "Configurar curso",
    highlight: "IA sugere currículos",
    icon: GraduationCap,
  },
  {
    title: "Broadcast no WhatsApp",
    description: "Envie disparos segmentados com CTA direto para o checkout.",
    buttonLabel: "Montar campanha",
    highlight: "23% CTR médio",
    icon: MessageSquare,
  },
  {
    title: "Ajustar planos e preços",
    description: "Atualize tiers, limites de IA e benefícios das assinaturas.",
    buttonLabel: "Editar planos",
    icon: ShieldCheck,
  },
]

const MONITORING_HIGHLIGHTS = [
  {
    label: "Fila WhatsApp",
    value: "32 tickets ativos",
    meta: "latência média 820ms",
    tone: "alert",
  },
  {
    label: "Uso de tokens GPT-4o",
    value: "68% da cota diária",
    meta: "reset em 6h",
    tone: "ok",
  },
  {
    label: "Jobs Supabase",
    value: "6 execuções pendentes",
    meta: "assinaturas > Kiwify",
    tone: "warn",
  },
]

const OPS_SIGNALS = [
  {
    label: "Uptime Edge Functions",
    value: 99.4,
    helper: "meta 99,0%",
  },
  {
    label: "Fila de respostas IA",
    value: 71,
    helper: "limite seguro 80%",
  },
  {
    label: "Bucket de assets dos cursos",
    value: 58,
    helper: "256 GB livres",
  },
]

const FALLBACK_TIMELINE = [
  {
    title: "Checkout anual aprovado",
    detail: "Ticket alto com mentoria entrou às 09h17",
    timeAgo: "há 45 minutos",
    status: "Pagamento",
  },
  {
    title: "Nova matrícula na trilha de Sedação",
    detail: "Lead veio da campanha 'IA no plantão'",
    timeAgo: "há 3 horas",
    status: "Curso",
  },
  {
    title: "Atualização do chatbot clínico",
    detail: "Prompt ajustado com protocolos CFO 2025",
    timeAgo: "há 5 horas",
    status: "Ops",
  },
]

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
      .select("id, title, description, lessons_count, duration, updated_at, created_at")
      .order("updated_at", { ascending: false }),
  ])

  const statuses: CourseStatus[] = ["Publicado", "Em revisão", "Rascunho"]

  const normalizedCourses: CoursePipelineRow[] =
    coursesData?.map((course, index) => {
      const status = statuses[index % statuses.length]
      return {
        id: course.id,
        title: course.title,
        lessons: course.lessons_count ?? 0,
        duration: course.duration ?? "—",
        status,
        enrollment:
          status === "Publicado"
            ? Math.max(80, 220 - index * 15)
            : status === "Em revisão"
              ? 45 + index * 12
              : 0,
        completion:
          status === "Publicado"
            ? Math.max(55, 90 - index * 6)
            : status === "Em revisão"
              ? 35 + index * 8
              : 0,
        updatedAt: course.updated_at ?? course.created_at ?? null,
      }
    }) ?? []

  const adminCourses = normalizedCourses.length > 0 ? normalizedCourses : SAMPLE_COURSES

  const totalCatalog = adminCourses.length
  const publishedCount = adminCourses.filter((course) => course.status === "Publicado").length || totalCatalog
  const reviewCount = adminCourses.filter((course) => course.status === "Em revisão").length

  const adminName = profile?.name || user.email?.split("@")[0] || "Admin"

  const kpis = [
    {
      label: "MRR projetado",
      value: "R$ 42.360",
      helper: "+8,2% nos últimos 30 dias",
      icon: TrendingUp,
    },
    {
      label: "Leads qualificados/semana",
      value: "187",
      helper: "+34 vs semana passada",
      icon: UsersRound,
    },
    {
      label: "Cursos publicados",
      value: String(publishedCount).padStart(2, "0"),
      helper: `${reviewCount} aguardando revisão`,
      icon: GraduationCap,
    },
    {
      label: "Tickets IA / 24h",
      value: "1.482",
      helper: "latência média 820ms",
      icon: Activity,
    },
  ]

  const timelineFromCourses = adminCourses.slice(0, 3).map((course) => ({
    title: course.title,
    detail:
      course.status === "Publicado"
        ? "Liberado no catálogo premium"
        : course.status === "Em revisão"
          ? "Checklist pedagógico em andamento"
          : "Rascunho aguardando gravação",
    timeAgo: course.updatedAt
      ? formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true, locale: ptBR })
      : "sem registro",
    status: course.status,
  }))

  const timeline = (timelineFromCourses.length ? timelineFromCourses : FALLBACK_TIMELINE).slice(0, 3)

  const formatUpdate = (value: string | null) => {
    if (!value) return "sem registro"
    return formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-0">
      <Card
        className={`${CARD_BASE_STYLES} relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#0b1a2f] via-[#061220] to-[#040a16]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.25),_transparent_60%)]" />
        <CardContent className="relative px-8 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Badge className="border-cyan-400/40 bg-cyan-400/10 text-cyan-200">
                Console administrativo
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Bem-vindo, {adminName}. Tudo pronto para escalar o SaaS.
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-300">
                  Centralize matrículas, ajustes de cursos, assinaturas e monitoramento de IA em um único painel
                  com visão operacional em tempo real.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                  <Sparkles className="h-4 w-4" />
                  Sincronizar Kiwify
                </Button>
                <Button variant="outline" className="rounded-2xl border-white/30 text-white hover:bg-white/10">
                  <ArrowUpRight className="h-4 w-4" />
                  Exportar relatórios
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                >
                  <Link href="/admin/usuarios/novo">
                    Cadastrar admin
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid w-full max-w-sm gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Novas matrículas (24h)</span>
                <strong className="text-xl text-white">+42</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Tickets resolvidos</span>
                <strong className="text-xl text-white">96%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Fila de revisão</span>
                <strong className="text-xl text-white">{reviewCount || 3}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className={`${CARD_BASE_STYLES} rounded-2xl`}>
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
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <Card className={`${CARD_BASE_STYLES} rounded-3xl`}>
          <CardHeader className="gap-1">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-cyan-300" />
              <div>
                <CardTitle className="text-white">Pipeline de cursos</CardTitle>
                <CardDescription className="text-slate-400">
                  Acompanhe do rascunho à publicação, com progresso pedagógico e impacto em receita.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-8">
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <table className="w-full text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Curso</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Inscrições</th>
                    <th className="px-6 py-4 text-left font-medium">% conclusão</th>
                    <th className="px-6 py-4 text-left font-medium">Atualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#070f1e]">
                  {adminCourses.map((course) => (
                    <tr key={course.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{course.title}</p>
                        <span className="text-xs text-slate-400">
                          {course.lessons} aulas · {course.duration}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${STATUS_BADGE_STYLES[course.status]} text-[11px]`}>
                          {course.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {course.enrollment > 0 ? course.enrollment : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {course.completion > 0 ? (
                          <div className="flex items-center gap-3">
                            <Progress
                              value={course.completion}
                              className="bg-white/10"
                            />
                            <span className="text-sm text-slate-200">{course.completion}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatUpdate(course.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className={`${CARD_BASE_STYLES} rounded-3xl`}>
            <CardHeader className="gap-2">
              <CardTitle className="text-white">Ações rápidas</CardTitle>
              <CardDescription className="text-slate-400">
                Execute rotinas de operação em um clique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {QUICK_ACTIONS.map(({ title, description, buttonLabel, icon: Icon, highlight }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{title}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" className="rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                      {buttonLabel}
                    </Button>
                    {highlight && (
                      <Badge className="border-white/20 bg-white/5 text-slate-300">{highlight}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={`${CARD_BASE_STYLES} rounded-3xl`}>
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <CardTitle className="text-white">Centro de alertas</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Priorize ajustes críticos antes de liberar novas turmas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Webhook Kiwify falhou 2x · Regerar secret e reenfileirar cobrança anual premium.
              </div>
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-50">
                12 alunos aguardam aprovação manual para mentoria de diagnóstico avançado.
              </div>
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                3 aulas com VSL desatualizadas · suba novas versões antes do próximo lote.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className={`${CARD_BASE_STYLES} rounded-3xl`}>
          <CardHeader className="gap-1">
            <CardTitle className="text-white">Criar novo curso</CardTitle>
            <CardDescription className="text-slate-400">
              Defina o posicionamento, público e formato. Depois conecte módulos e materiais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Nome do curso</label>
              <Input placeholder="Ex: Odontopediatria humanizada com IA" className="border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Categoria</label>
              <Select defaultValue="especializacao">
                <SelectTrigger className="w-full border-white/20 bg-white/5 text-white">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#050b16] text-slate-100">
                  <SelectItem value="especializacao">Especialização premium</SelectItem>
                  <SelectItem value="mentoria">Mentoria clínica ao vivo</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp intensivo</SelectItem>
                  <SelectItem value="imediato">Protocolos express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Investimento (ticket)</label>
                <Input placeholder="R$ 2.497" className="border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Carga horária</label>
                <Input placeholder="12 horas" className="border-white/20 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Resultados prometidos</label>
              <Textarea
                rows={4}
                placeholder="Protocolos aplicáveis, templates aprovados pelo CFO, checklists cirúrgicos..."
                className="border-white/20 text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                <Sparkles className="h-4 w-4" />
                Gerar currículo com IA
              </Button>
              <Button variant="outline" className="rounded-2xl border-white/30 text-white hover:bg-white/10">
                Salvar como rascunho
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={`${CARD_BASE_STYLES} rounded-3xl`}>
          <CardHeader className="gap-2">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-cyan-300" />
              <CardTitle className="text-white">Monitoramento em tempo real</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Observe sinais críticos do SaaS e libere turmas com confiança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {MONITORING_HIGHLIGHTS.map(({ label, value, meta, tone }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="text-base font-semibold text-white">{value}</p>
                    <p className="text-xs text-slate-500">{meta}</p>
                  </div>
                  <Badge
                    className={
                      tone === "alert"
                        ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                        : tone === "warn"
                          ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                          : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    }
                  >
                    {tone === "alert" ? "Crítico" : tone === "warn" ? "Monitorar" : "Estável"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#050b16]/80 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Saúde operacional</p>
              <div className="space-y-4">
                {OPS_SIGNALS.map((signal) => (
                  <div key={signal.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{signal.label}</span>
                      <span className="font-semibold text-white">{signal.value}%</span>
                    </div>
                    <Progress value={signal.value} className="bg-white/10" />
                    <p className="text-xs text-slate-500">{signal.helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Linha do tempo</p>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 text-xs font-semibold text-white">
                      <div className="flex h-full w-full items-center justify-center">
                        {event.status ? event.status.toString().slice(0, 2).toUpperCase() : "OK"}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-white">{event.title}</p>
                      <p className="text-xs text-slate-400">{event.detail}</p>
                      <span className="text-xs text-slate-500">{event.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
