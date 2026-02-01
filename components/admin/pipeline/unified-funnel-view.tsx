"use client"

import { useEffect, useState } from "react"
import { Loader2, TrendingUp, TrendingDown, Users, UserCheck, CreditCard, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFunnelMetrics } from "@/app/actions/unified-funnel"
import { LEAD_STAGES, PROFILE_STAGES, type FunnelMetrics } from "@/lib/funnel-stages"

interface FunnelStageBoxProps {
  label: string
  icon: string
  count: number
  color: string
  isActive?: boolean
}

function FunnelStageBox({ label, icon, count, color, isActive = false }: FunnelStageBoxProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[100px]",
      isActive ? "bg-card border-primary/30 shadow-lg shadow-primary/10" : "bg-card/50 border-border/50 hover:border-border"
    )}>
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-lg font-bold text-foreground">{count}</span>
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  color?: string
}

function MetricCard({ title, value, subtitle, icon, trend, color = "text-primary" }: MetricCardProps) {
  return (
    <div className="bg-card/50 rounded-xl p-5 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color === "text-primary" ? "bg-primary/10" : color === "text-emerald-400" ? "bg-emerald-500/10" : "bg-violet-500/10")}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" ? "bg-emerald-500/10 text-emerald-400" :
            trend === "down" ? "bg-rose-500/10 text-rose-400" :
            "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
            {trend === "up" ? "Alta" : trend === "down" ? "Baixa" : "Estavel"}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

export function UnifiedFunnelView() {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFunnelMetrics()
      if (result.success && result.data) {
        setMetrics(result.data)
      } else {
        setError(result.message || "Erro ao carregar metricas")
      }
    } catch (err) {
      setError("Erro ao carregar metricas do funil")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando metricas...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-rose-400 font-medium">Erro ao carregar metricas</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const prospectingStages = LEAD_STAGES.filter(s => s.id !== "convertido" && s.id !== "descartado")
  const trialStages = PROFILE_STAGES.filter(s => s.id !== "convertido" && s.id !== "perdido" && s.id !== "risco_churn")

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Funil Completo</h2>
        <p className="text-muted-foreground">Visao integrada do funil de vendas: Prospeccao - Trial - Pro</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads"
          value={metrics.overall.totalLeads}
          subtitle="Leads importados"
          icon={<Users className="w-5 h-5 text-primary" />}
          color="text-primary"
        />
        <MetricCard
          title="Usuarios Trial"
          value={metrics.overall.totalTrials}
          subtitle={`${metrics.overall.leadToTrialRate}% conversao de leads`}
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
          color="text-emerald-400"
          trend={metrics.overall.leadToTrialRate > 20 ? "up" : metrics.overall.leadToTrialRate > 10 ? "neutral" : "down"}
        />
        <MetricCard
          title="Clientes Pro"
          value={metrics.overall.totalPaid}
          subtitle={`${metrics.overall.trialToPaidRate}% conversao de trial`}
          icon={<CreditCard className="w-5 h-5 text-violet-400" />}
          color="text-violet-400"
          trend={metrics.overall.trialToPaidRate > 15 ? "up" : metrics.overall.trialToPaidRate > 5 ? "neutral" : "down"}
        />
        <MetricCard
          title="Conversao Geral"
          value={`${metrics.overall.leadToPaidRate}%`}
          subtitle="Lead para Pro"
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          color="text-amber-400"
          trend={metrics.overall.leadToPaidRate > 5 ? "up" : metrics.overall.leadToPaidRate > 2 ? "neutral" : "down"}
        />
      </div>

      {/* Visual Funnel */}
      <div className="bg-card/30 rounded-2xl border border-border/50 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          Jornada do Cliente
        </h3>

        {/* Prospecting Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prospeccao</span>
            <div className="flex-1 h-px bg-border/50"></div>
            <span className="text-xs text-muted-foreground font-mono">{metrics.prospecting.total} leads</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {prospectingStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2 shrink-0">
                <FunnelStageBox
                  label={stage.label}
                  icon={stage.icon}
                  count={metrics.prospecting.byStage[stage.id] || 0}
                  color={stage.color}
                  isActive={metrics.prospecting.byStage[stage.id] > 0}
                />
                {index < prospectingStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Arrow */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-500/50"></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="text-lg">📋</span>
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Cadastro</span>
              <span className="text-xs text-green-400/70">({metrics.prospecting.byStage.convertido || 0})</span>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-500/50"></div>
          </div>
        </div>

        {/* Trial Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trial</span>
            <div className="flex-1 h-px bg-border/50"></div>
            <span className="text-xs text-muted-foreground font-mono">{metrics.trial.total} usuarios</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {trialStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2 shrink-0">
                <FunnelStageBox
                  label={stage.label}
                  icon={stage.icon}
                  count={metrics.trial.byStage[stage.id] || 0}
                  color={stage.color}
                  isActive={metrics.trial.byStage[stage.id] > 0}
                />
                {index < trialStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final Conversion */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/50"></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
              <span className="text-lg">💳</span>
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Pro</span>
              <span className="text-xs text-violet-400/70">({metrics.trial.byStage.convertido || 0})</span>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/50"></div>
          </div>
        </div>

        {/* Lost/Risk Section */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">👻</span>
            <span className="text-xs">Risco Churn: {metrics.trial.byStage.risco_churn || 0}</span>
          </div>
          <div className="w-px h-4 bg-border/50"></div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">❌</span>
            <span className="text-xs">Perdidos: {(metrics.trial.byStage.perdido || 0) + (metrics.prospecting.byStage.descartado || 0)}</span>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card/30 rounded-xl border border-border/50 p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Taxa de Conversao - Prospeccao</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Leads - Trial</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, metrics.prospecting.conversionRate)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground min-w-[40px] text-right">
                  {metrics.prospecting.conversionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/30 rounded-xl border border-border/50 p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Taxa de Conversao - Trial</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Trial - Pro</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                    style={{ width: `${Math.min(100, metrics.trial.conversionRate)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground min-w-[40px] text-right">
                  {metrics.trial.conversionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
