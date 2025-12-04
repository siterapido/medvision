"use client"

import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowUpRight, Clock3, Mail, Phone, Sparkles, Target, Users } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"

type TrialLead = {
  id: string
  name?: string | null
  email?: string | null
  whatsapp?: string | null
  profession?: string | null
  company?: string | null
  institution?: string | null
  plan_type?: string | null
  subscription_status?: string | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_used?: boolean | null
  created_at?: string | null
}

type StageId = "novo" | "ativo" | "expirando" | "expirado" | "convertido"

type StageConfig = {
  id: StageId
  title: string
  description: string
  accent: string
  headerTone: string
  badgeTone: string
}

const STAGES: StageConfig[] = [
  {
    id: "novo",
    title: "Novos trials",
    description: "Leads recém cadastrados ou ainda sem datas definidas.",
    accent: "from-sky-500/20 via-cyan-500/10 to-slate-900/60",
    headerTone: "border-sky-500/40 text-sky-200",
    badgeTone: "bg-sky-500/15 text-sky-100 border-sky-500/30",
  },
  {
    id: "ativo",
    title: "Em andamento",
    description: "Trial rolando com margem confortável.",
    accent: "from-emerald-500/15 via-teal-500/10 to-slate-900/60",
    headerTone: "border-emerald-500/40 text-emerald-200",
    badgeTone: "bg-emerald-500/15 text-emerald-100 border-emerald-500/30",
  },
  {
    id: "expirando",
    title: "Urgentes",
    description: "Expiram em até 2 dias. Hora de converter.",
    accent: "from-amber-500/20 via-orange-500/10 to-slate-900/60",
    headerTone: "border-amber-500/50 text-amber-100",
    badgeTone: "bg-amber-500/15 text-amber-100 border-amber-500/30",
  },
  {
    id: "expirado",
    title: "Expirados",
    description: "Trial acabou e ainda não fecharam.",
    accent: "from-slate-700/60 via-slate-800 to-slate-900/80",
    headerTone: "border-slate-500/40 text-slate-200",
    badgeTone: "bg-slate-700 text-slate-50 border-slate-500/40",
  },
  {
    id: "convertido",
    title: "Convertidos",
    description: "Já migraram para plano pago.",
    accent: "from-indigo-500/20 via-purple-500/10 to-slate-900/60",
    headerTone: "border-indigo-500/50 text-indigo-100",
    badgeTone: "bg-indigo-500/15 text-indigo-50 border-indigo-500/30",
  },
]

type TrialLeadWithStage = TrialLead & { stage: StageId }

function resolveStage(lead: TrialLead): StageId {
  const now = new Date()
  const endsAt = lead.trial_ends_at ? new Date(lead.trial_ends_at) : null
  const startsAt = lead.trial_started_at ? new Date(lead.trial_started_at) : null
  const hasPaidPlan = !!lead.plan_type && lead.plan_type !== "free"
  const hasActiveSubscription =
    !!lead.subscription_status &&
    !["canceled", "inactive", "trialing", "free"].includes(lead.subscription_status)

  if (hasPaidPlan || hasActiveSubscription) {
    return "convertido"
  }

  if ((lead.trial_used && !endsAt) || (endsAt && endsAt.getTime() < now.getTime())) {
    return "expirado"
  }

  if (endsAt) {
    const daysRemaining = Math.max(0, getRemainingTrialDays(endsAt))
    if (daysRemaining <= 2) return "expirando"
    return "ativo"
  }

  if (startsAt) {
    return "ativo"
  }

  return "novo"
}

function formatDate(value?: string | null) {
  if (!value) return null
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return null
  }
}

function sanitizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("55") ? digits : `55${digits}`
}

export function TrialCrmBoard({ leads }: { leads: TrialLead[] }) {
  const [search, setSearch] = useState("")

  const { groupedLeads, totals, filteredCount } = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = leads.filter((lead) => {
      if (!normalizedSearch) return true
      return [
        lead.name,
        lead.email,
        lead.whatsapp,
        lead.profession,
        lead.company,
        lead.institution,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })

    const withStage: TrialLeadWithStage[] = filtered.map((lead) => ({
      ...lead,
      stage: resolveStage(lead),
    }))

    const grouped: Record<StageId, TrialLeadWithStage[]> = {
      novo: [],
      ativo: [],
      expirando: [],
      expirado: [],
      convertido: [],
    }

    withStage.forEach((lead) => {
      grouped[lead.stage].push(lead)
    })

    return {
      groupedLeads: grouped,
      filteredCount: filtered.length,
      totals: {
        total: leads.length,
        ativos: grouped.ativo.length,
        urgentes: grouped.expirando.length,
        expirados: grouped.expirado.length,
        convertidos: grouped.convertido.length,
      },
    }
  }, [leads, search])

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-[#0F192F] via-[#0F1C2D] to-[#0B1323] border-slate-800 shadow-lg">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              CRM de Trials
            </CardTitle>
            <CardDescription className="text-slate-300">
              Organize os leads de teste gratuito, priorize follow-up e acompanhe conversões.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
              <Users className="h-4 w-4 text-cyan-400" />
              {filteredCount} leads filtrados
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail ou WhatsApp"
              className="bg-[#0B1627] border-slate-700 text-white placeholder:text-slate-500 w-full md:w-[260px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Trials ativos"
              value={totals.ativos}
              tone="text-emerald-300"
              hint="em execução"
            />
            <StatCard
              title="Urgentes"
              value={totals.urgentes}
              tone="text-amber-300"
              hint="<= 2 dias"
            />
            <StatCard
              title="Expirados"
              value={totals.expirados}
              tone="text-slate-200"
              hint="aguardando contato"
            />
            <StatCard
              title="Convertidos"
              value={totals.convertidos}
              tone="text-indigo-200"
              hint="pós-trial"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {STAGES.map((stage) => (
          <Card
            key={stage.id}
            className={cn(
              "border-slate-800/80 bg-gradient-to-b shadow-lg overflow-hidden",
              stage.accent
            )}
          >
            <CardHeader className="border-b border-dashed pb-4 backdrop-blur-sm bg-black/10">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full shadow ring-4 ring-white/5",
                        stage.headerTone
                      )}
                    />
                    {stage.title}
                  </CardTitle>
                  <CardDescription className="text-slate-200">{stage.description}</CardDescription>
                </div>
                <Badge variant="outline" className={cn(stage.badgeTone, "border text-xs")}>
                  {groupedLeads[stage.id]?.length ?? 0} lead
                  {groupedLeads[stage.id]?.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {(groupedLeads[stage.id] || []).map((lead) => (
                    <LeadCard key={lead.id} lead={lead} tone={stage} />
                  ))}
                  {(groupedLeads[stage.id] || []).length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700/80 bg-black/10 py-8 text-center">
                      <Clock3 className="h-5 w-5 text-slate-500" />
                      <p className="text-sm text-slate-400">Nenhum lead aqui no momento.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatCard({ title, value, tone, hint }: { title: string; value: number; tone: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-black/30 p-3 shadow-inner">
      <p className="text-xs text-slate-400">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold", tone)}>{value}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </div>
    </div>
  )
}

function LeadCard({ lead, tone }: { lead: TrialLeadWithStage; tone: StageConfig }) {
  const daysRemaining = lead.trial_ends_at ? Math.max(0, getRemainingTrialDays(lead.trial_ends_at)) : null
  const formattedEnd = formatDate(lead.trial_ends_at)
  const formattedStart = formatDate(lead.trial_started_at)
  const ageLabel = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })
    : null
  const phoneDigits = sanitizePhone(lead.whatsapp)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const isPaid = !!lead.plan_type && lead.plan_type !== "free"

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#0A1526]/70 p-3 shadow-md space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white leading-tight">
            {lead.name || "Lead sem nome"}
          </p>
          <p className="text-xs text-slate-400">{lead.email || "Sem e-mail"}</p>
        </div>
        <Badge variant="outline" className={cn("border text-xs", tone.badgeTone)}>
          {lead.stage === "convertido"
            ? "Plano ativo"
            : lead.stage === "expirando"
              ? "Expira em breve"
              : lead.stage === "expirado"
                ? "Trial finalizado"
                : "Trial aberto"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {isPaid ? (
          <Badge className="bg-indigo-500/20 text-indigo-100 border-indigo-500/40">
            Plano {lead.plan_type}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-100 border-emerald-500/30">
            Plano free
          </Badge>
        )}
        {daysRemaining !== null && (
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-100">
            {daysRemaining} dia{daysRemaining === 1 ? "" : "s"} restantes
          </Badge>
        )}
        {lead.profession && (
          <Badge variant="outline" className="border-slate-600 text-slate-100">
            {lead.profession}
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-sm text-slate-200">
        <InfoRow icon={<Mail className="h-4 w-4 text-cyan-300" />} label={lead.email || "Sem e-mail"} />
        <InfoRow
          icon={<Phone className="h-4 w-4 text-emerald-300" />}
          label={lead.whatsapp || "Sem WhatsApp"}
        />
        <InfoRow
          icon={<Clock3 className="h-4 w-4 text-amber-300" />}
          label={
            formattedEnd
              ? `Termina em ${formattedEnd}${daysRemaining !== null ? ` (${daysRemaining}d)` : ""}`
              : "Sem data de término"
          }
        />
        <InfoRow
          icon={<Target className="h-4 w-4 text-purple-300" />}
          label={formattedStart ? `Início em ${formattedStart}` : "Ainda sem início registrado"}
        />
        {lead.company && (
          <InfoRow icon={<Sparkles className="h-4 w-4 text-cyan-300" />} label={lead.company} />
        )}
        {lead.institution && (
          <InfoRow icon={<Sparkles className="h-4 w-4 text-indigo-300" />} label={lead.institution} />
        )}
        {ageLabel && (
          <InfoRow
            icon={<Clock3 className="h-4 w-4 text-slate-300" />}
            label={`Criado ${ageLabel.replace("menos de", "<")}`}
          />
        )}
      </div>

      <div className="flex gap-2">
        {whatsappUrl && (
          <Button asChild variant="secondary" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        )}
        <Button variant="outline" className="border-slate-700 text-slate-200 hover:text-white" asChild>
          <Link href={`/admin/usuarios/${lead.id}`}>
            Ver perfil
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 px-2 py-1.5">
      <span className="shrink-0">{icon}</span>
      <span className="text-xs text-slate-200 leading-tight">{label}</span>
    </div>
  )
}
