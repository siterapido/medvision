"use client"

import { Loader2, LayoutGrid, TrendingUp, Users, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FunnelCard } from "./funnel-card"
import type { FunnelCardData } from "@/lib/types/funnel"

interface FunnelDashboardProps {
  funnels: FunnelCardData[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function FunnelDashboard({ funnels, isLoading, onRefresh }: FunnelDashboardProps) {
  // Calculate overall stats
  const stats = {
    totalLeads: funnels.reduce((acc, f) => acc + f.total_leads, 0),
    totalConverted: funnels.reduce((acc, f) => acc + f.converted_leads, 0),
    totalUrgent: funnels.reduce((acc, f) => acc + f.urgent_count, 0),
    averageConversion: funnels.length > 0
      ? Math.round(funnels.reduce((acc, f) => acc + f.conversion_rate, 0) / funnels.length)
      : 0,
    activeFunnels: funnels.filter(f => f.is_active).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando funis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Funnels */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.activeFunnels}</p>
            <p className="text-xs text-muted-foreground">Funis Ativos</p>
          </div>
        </div>

        {/* Total Leads */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalLeads}</p>
            <p className="text-xs text-muted-foreground">Total de Leads</p>
          </div>
        </div>

        {/* Total Converted */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{stats.totalConverted}</p>
            <p className="text-xs text-muted-foreground">Convertidos</p>
          </div>
        </div>

        {/* Urgent */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            stats.totalUrgent > 0 ? "bg-amber-500/10" : "bg-muted/50"
          )}>
            <AlertTriangle className={cn(
              "w-5 h-5",
              stats.totalUrgent > 0 ? "text-amber-500" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              stats.totalUrgent > 0 ? "text-amber-500" : "text-foreground"
            )}>
              {stats.totalUrgent}
            </p>
            <p className="text-xs text-muted-foreground">Em Risco</p>
          </div>
        </div>
      </div>

      {/* Funnel Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Seus Funis de Conversao
          </h2>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          )}
        </div>

        {funnels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum funil configurado
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Configure seus funis de conversao para comecar a acompanhar seus leads e taxas de conversao.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {funnels.map((funnel) => (
              <FunnelCard key={funnel.id} funnel={funnel} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
