"use client"

import { useMemo, useState, useCallback } from "react"
import { Calendar, Clock, ChevronDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { LeadCard } from "./lead-card"
import { BulkActionsBar } from "./bulk-actions-bar"

const LEADS_PER_COLUMN = 15

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
  pipeline_stage?: string | null
  chat_count?: number | null
  vision_used?: boolean | null
  last_active_at?: string | null
  assigned_to?: string | null
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

type TrialDay = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "expired" | "converted"

type DayConfig = {
  id: TrialDay
  title: string
  emoji: string
  color: string
  description: string
}

const TRIAL_DAYS: DayConfig[] = [
  {
    id: 1,
    title: "Dia 1",
    emoji: "1️⃣",
    color: "bg-emerald-500",
    description: "Primeiro dia - Onboarding"
  },
  {
    id: 2,
    title: "Dia 2",
    emoji: "2️⃣",
    color: "bg-green-500",
    description: "Segundo dia - Explorando"
  },
  {
    id: 3,
    title: "Dia 3",
    emoji: "3️⃣",
    color: "bg-lime-500",
    description: "Terceiro dia - Engajando"
  },
  {
    id: 4,
    title: "Dia 4",
    emoji: "4️⃣",
    color: "bg-yellow-500",
    description: "Quarto dia - Metade"
  },
  {
    id: 5,
    title: "Dia 5",
    emoji: "5️⃣",
    color: "bg-amber-500",
    description: "Quinto dia - Decisao"
  },
  {
    id: 6,
    title: "Dia 6",
    emoji: "6️⃣",
    color: "bg-orange-500",
    description: "Sexto dia - Urgencia"
  },
  {
    id: 7,
    title: "Dia 7",
    emoji: "7️⃣",
    color: "bg-red-500",
    description: "Ultimo dia - Conversao"
  },
  {
    id: "converted",
    title: "Convertidos",
    emoji: "💳",
    color: "bg-green-600",
    description: "Converteram para Pro"
  },
  {
    id: "expired",
    title: "Expirados",
    emoji: "⏰",
    color: "bg-slate-500",
    description: "Trial encerrado"
  },
]

function getTrialDay(lead: TrialLead): TrialDay {
  // Check if converted - must have PAID plan (not free) AND active subscription
  const hasPaidPlan = !!lead.plan_type && lead.plan_type !== "free"
  const hasActiveSubscription =
    !!lead.subscription_status &&
    !["canceled", "inactive", "trialing", "free", "refunded"].includes(lead.subscription_status)

  // Only consider converted if they have a paid plan with active subscription
  // OR if manually marked as converted in pipeline
  if ((hasPaidPlan && hasActiveSubscription) || lead.pipeline_stage === "convertido") {
    return "converted"
  }

  if (!lead.trial_started_at) {
    return 1 // Default to day 1 if no trial start date
  }

  const now = new Date()
  const trialStart = new Date(lead.trial_started_at)
  const diffTime = now.getTime() - trialStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 because day 1 is the start day

  if (diffDays <= 0) return 1
  if (diffDays > 7) return "expired"
  return diffDays as TrialDay
}

function getTrialProgress(lead: TrialLead): { day: number; total: number; percent: number } {
  if (!lead.trial_started_at) {
    return { day: 1, total: 7, percent: 14 }
  }

  const now = new Date()
  const trialStart = new Date(lead.trial_started_at)
  const diffTime = now.getTime() - trialStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

  const day = Math.max(1, Math.min(diffDays, 7))
  const percent = Math.round((day / 7) * 100)

  return { day, total: 7, percent }
}

type TrialLeadWithDay = TrialLead & { trialDay: TrialDay; trialProgress: ReturnType<typeof getTrialProgress> }

interface DayColumnProps {
  day: DayConfig
  leads: TrialLeadWithDay[]
  onStageChange: () => void
  visibleCount: number
  hasMore: boolean
  onLoadMore: () => void
  selectedIds: string[]
  onSelectLead: (id: string, selected: boolean) => void
  onSelectAll: (ids: string[], selected: boolean) => void
  selectionMode: boolean
}

function DayColumn({
  day,
  leads,
  onStageChange,
  visibleCount,
  hasMore,
  onLoadMore,
  selectedIds,
  onSelectLead,
  onSelectAll,
  selectionMode
}: DayColumnProps) {
  const visibleLeads = leads.slice(0, visibleCount)
  const remainingCount = leads.length - visibleCount
  const columnLeadIds = leads.map(lead => lead.id)
  const allSelected = leads.length > 0 && columnLeadIds.every(id => selectedIds.includes(id))
  const someSelected = columnLeadIds.some(id => selectedIds.includes(id))

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(columnLeadIds, checked)
  }

  // Calculate stats for the column
  const activeLeads = leads.filter(l => {
    if (!l.last_active_at) return false
    const lastActive = new Date(l.last_active_at)
    const now = new Date()
    const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)
    return hoursSinceActive < 24
  }).length

  const isUrgentDay = day.id === 6 || day.id === 7
  const isFinalDay = day.id === 7
  const isExpired = day.id === "expired"
  const isConverted = day.id === "converted"

  return (
    <div
      className={cn(
        "shrink-0 w-64 lg:w-72 flex flex-col rounded-2xl overflow-hidden transition-all duration-300",
        "bg-card/40 backdrop-blur-md",
        "border border-border/50",
        "group/column hover:bg-card/60",
        isUrgentDay && !isConverted && "ring-1 ring-amber-500/20",
        isFinalDay && "ring-1 ring-red-500/30",
        isConverted && "ring-1 ring-green-500/30"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 shrink-0 border-b border-border/40 relative overflow-hidden",
        "bg-gradient-to-b from-background/50 to-transparent"
      )}>
        {/* Top Color Accent */}
        <div className={cn("absolute top-0 left-0 right-0 h-[3px]", day.color)} />

        <div className="flex items-center gap-2">
          {leads.length > 0 && (
            <div className="relative shrink-0">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className={cn(
                  "border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5",
                  someSelected && !allSelected && "bg-primary/30 border-primary"
                )}
              />
              {someSelected && !allSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm" />
                </div>
              )}
            </div>
          )}
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm",
            "bg-background/50 border border-border/50"
          )}>
            {day.emoji}
          </div>
          <div>
            <h3 className="text-xs font-heading font-bold text-slate-100 leading-tight tracking-tight flex items-center gap-1.5">
              {day.title}
              {isUrgentDay && !isConverted && !isExpired && (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
              {isConverted && (
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              )}
              {isExpired && (
                <XCircle className="w-3 h-3 text-slate-400" />
              )}
            </h3>
            <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">
              {day.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-bold text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-border/50 shadow-sm min-w-[24px] text-center">
            {leads.length}
          </span>
          {activeLeads > 0 && !isExpired && !isConverted && (
            <span className="text-[8px] text-green-400 font-medium">
              {activeLeads} ativo{activeLeads > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="overflow-y-auto px-2.5 py-3 custom-scrollbar max-h-[calc(100vh-220px)]">
        <div className="space-y-2 min-h-[80px]">
          {visibleLeads.map((lead) => (
            <div key={lead.id} className="relative">
              {/* Trial Progress Indicator */}
              {typeof lead.trialDay === "number" && (
                <div className="absolute -top-1 -right-1 z-10">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                    "border-2 border-card shadow-sm",
                    lead.trialProgress.percent <= 42 && "bg-green-500 text-white",
                    lead.trialProgress.percent > 42 && lead.trialProgress.percent <= 71 && "bg-amber-500 text-white",
                    lead.trialProgress.percent > 71 && "bg-red-500 text-white"
                  )}>
                    {lead.trialProgress.day}
                  </div>
                </div>
              )}
              <LeadCard
                lead={lead}
                onStageChange={onStageChange}
                isSelected={selectedIds.includes(lead.id)}
                onSelect={onSelectLead}
                selectionMode={selectionMode}
              />
            </div>
          ))}
          {visibleLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center opacity-50 group-hover/column:opacity-80 transition-opacity">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border border-border/50",
                "bg-background/50"
              )}>
                {isConverted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : isExpired ? (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium max-w-[100px]">
                {isConverted ? "Nenhum convertido" : isExpired ? "Nenhum expirado" : "Nenhum lead neste dia"}
              </p>
            </div>
          )}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-[10px] text-muted-foreground hover:text-foreground h-7"
              onClick={onLoadMore}
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Carregar mais ({remainingCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Trial7DaysView({ leads }: { leads: TrialLead[] }) {
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [columnPages, setColumnPages] = useState<Record<string, number>>({
    "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1,
    "converted": 1, "expired": 1
  })

  const loadMoreInColumn = useCallback((dayId: string) => {
    setColumnPages(prev => ({
      ...prev,
      [dayId]: prev[dayId] + 1
    }))
  }, [])

  const handleSelectLead = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleSelectAll = (ids: string[], selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => {
        const newIds = ids.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    } else {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleActionComplete = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const selectionMode = selectedIds.length > 0

  const { groupedLeads, stats } = useMemo(() => {
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

    const withDay: TrialLeadWithDay[] = filtered.map((lead) => ({
      ...lead,
      trialDay: getTrialDay(lead),
      trialProgress: getTrialProgress(lead),
    }))

    const grouped: Record<string, TrialLeadWithDay[]> = {
      "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [],
      "converted": [], "expired": []
    }

    withDay.forEach((lead) => {
      const key = String(lead.trialDay)
      if (grouped[key]) {
        grouped[key].push(lead)
      } else {
        grouped["1"].push(lead) // fallback
      }
    })

    // Sort each column by last_active_at (most recent first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const aDate = a.last_active_at ? new Date(a.last_active_at).getTime() : 0
        const bDate = b.last_active_at ? new Date(b.last_active_at).getTime() : 0
        return bDate - aDate
      })
    })

    // Calculate stats
    const activeDays = [1, 2, 3, 4, 5, 6, 7] as const
    const inTrial = activeDays.reduce((acc, day) => acc + grouped[String(day)].length, 0)
    const converted = grouped["converted"].length
    const expired = grouped["expired"].length
    const urgentDays = grouped["6"].length + grouped["7"].length

    return {
      groupedLeads: grouped,
      stats: {
        total: filtered.length,
        inTrial,
        converted,
        expired,
        urgentDays,
        conversionRate: inTrial + converted + expired > 0
          ? Math.round((converted / (inTrial + converted + expired)) * 100)
          : 0
      }
    }
  }, [leads, search, refreshKey])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setColumnPages({
      "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1,
      "converted": 1, "expired": 1
    })
  }

  const handleStageChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-10 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Trial 7 Dias
            </h2>
          </div>

          {/* Stats Pills */}
          <div className="hidden md:flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
              {stats.inTrial} em trial
            </div>
            {stats.urgentDays > 0 && (
              <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.urgentDays} urgente{stats.urgentDays > 1 ? "s" : ""}
              </div>
            )}
            <div className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium">
              {stats.converted} convertido{stats.converted !== 1 ? "s" : ""} ({stats.conversionRate}%)
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-medium">
              {stats.expired} expirado{stats.expired !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nome, email..."
              className="pl-9 h-9 w-full bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 text-xs focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-muted transition-all rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="flex flex-row gap-3 p-6 min-w-max h-full items-stretch">
          {TRIAL_DAYS.map((day) => {
            const dayLeads = groupedLeads[String(day.id)] || []
            const visibleCount = columnPages[String(day.id)] * LEADS_PER_COLUMN
            const hasMore = dayLeads.length > visibleCount
            return (
              <DayColumn
                key={day.id}
                day={day}
                leads={dayLeads}
                onStageChange={handleStageChange}
                visibleCount={visibleCount}
                hasMore={hasMore}
                onLoadMore={() => loadMoreInColumn(String(day.id))}
                selectedIds={selectedIds}
                onSelectLead={handleSelectLead}
                onSelectAll={handleSelectAll}
                selectionMode={selectionMode}
              />
            )
          })}
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onActionComplete={handleActionComplete}
        type="profile"
        showDelete={false}
      />
    </div>
  )
}
