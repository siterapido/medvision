"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp, Users, AlertTriangle, Calendar, Target, Zap, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FunnelCardData, FunnelType } from "@/lib/types/funnel"
import { FUNNEL_TYPE_CONFIG, VIEW_TYPE_CONFIG } from "@/lib/types/funnel"

interface FunnelCardProps {
  funnel: FunnelCardData
}

const FUNNEL_ICONS: Record<FunnelType, React.ElementType> = {
  cold_prospecting: Target,
  paid_traffic: Zap,
  event: Video,
  trial: Calendar
}

export function FunnelCard({ funnel }: FunnelCardProps) {
  const typeConfig = FUNNEL_TYPE_CONFIG[funnel.funnel_type]
  const Icon = FUNNEL_ICONS[funnel.funnel_type]

  // Determine the link based on funnel type
  const getViewLink = () => {
    switch (funnel.slug) {
      case "prospeccao-fria":
        return "/admin/pipeline?tab=cold"
      case "trial-7-dias":
        return "/admin/pipeline?tab=trial7days"
      case "trafego-pago":
        return "/admin/pipeline?tab=cold" // Uses same view for now
      case "eventos":
        return "/admin/pipeline?tab=trial" // Events use profile-based view
      default:
        return `/admin/pipeline?funnel=${funnel.slug}`
    }
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm",
        "transition-all duration-300 hover:border-border hover:bg-card/60 hover:shadow-lg",
        "hover:shadow-primary/5"
      )}
    >
      {/* Top accent color */}
      <div className={cn("h-1", typeConfig.color)} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-background/60 border border-border/50 shadow-sm"
            )}>
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground leading-tight">
                {funnel.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {typeConfig.label}
                {funnel.trial_duration_days && ` - ${funnel.trial_duration_days} dias`}
              </p>
            </div>
          </div>

          {funnel.is_default && (
            <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Padrao
            </span>
          )}
        </div>

        {/* Description */}
        {funnel.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
            {funnel.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Total Leads */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-background/50 border border-border/30">
            <Users className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-lg font-bold text-foreground">{funnel.total_leads}</span>
            <span className="text-[9px] text-muted-foreground">Total</span>
          </div>

          {/* Converted */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-green-500/5 border border-green-500/20">
            <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
            <span className="text-lg font-bold text-green-500">{funnel.converted_leads}</span>
            <span className="text-[9px] text-muted-foreground">Convertidos</span>
          </div>

          {/* Conversion Rate */}
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-[10px] text-muted-foreground mb-1">Taxa</span>
            <span className="text-lg font-bold text-primary">{funnel.conversion_rate}%</span>
            <span className="text-[9px] text-muted-foreground">Conversao</span>
          </div>
        </div>

        {/* Urgent Alert (for trial funnels) */}
        {funnel.urgent_count > 0 && (
          <div className="flex items-center gap-2 p-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-400">
              <span className="font-semibold">{funnel.urgent_count}</span> lead{funnel.urgent_count > 1 ? "s" : ""} em risco
            </span>
          </div>
        )}

        {/* Available Views */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] text-muted-foreground mr-1">Visualizacoes:</span>
          {funnel.available_views.map((view) => (
            <span
              key={view}
              className="px-2 py-0.5 text-[9px] rounded-full bg-muted/50 text-muted-foreground border border-border/30"
            >
              {VIEW_TYPE_CONFIG[view].icon} {VIEW_TYPE_CONFIG[view].label}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <Link
          href={getViewLink()}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl",
            "text-sm font-medium transition-all duration-200",
            "bg-primary/10 text-primary border border-primary/20",
            "hover:bg-primary/20 hover:border-primary/30",
            "group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
          )}
        >
          Visualizar Pipeline
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
