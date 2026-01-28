"use client"

import { useEffect, useState, useTransition } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BookOpen,
  Calendar,
  CreditCard,
  GraduationCap,
  History,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
  Users,
  Clock3,
  Sparkles
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getLeadDetails, updatePipelineStage, assignLeadToSeller, getSellers } from "@/app/actions/pipeline"
import { getRemainingTrialDays } from "@/lib/trial"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeadActionsBar, PipelineStage } from "./lead-actions-bar"
import { LeadTimeline, TimelineEvent } from "./lead-timeline"
import { FollowupScheduler } from "./followup-scheduler"
import { NotesModal } from "./notes-modal"
import { cn } from "@/lib/utils"

interface LeadDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName?: string | null
  onStageChange?: () => void
}

export function LeadDetailsDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onStageChange,
}: LeadDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [followupOpen, setFollowupOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [isUpdatingStage, startStageTransition] = useTransition()
  const [sellers, setSellers] = useState<Array<{ id: string; name: string | null; email: string | null }>>([])
  const [isAssigningSeller, setIsAssigningSeller] = useState(false)

  useEffect(() => {
    if (open && leadId) {
      loadData()
      loadSellers()
    }
  }, [open, leadId])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getLeadDetails(leadId)
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSellers = async () => {
    try {
      const result = await getSellers()
      if (result.success && result.data) {
        setSellers(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar vendedores:", error)
    }
  }

  const handleAssignSeller = async (sellerId: string | null) => {
    setIsAssigningSeller(true)
    try {
      const result = await assignLeadToSeller(leadId, sellerId)
      if (result.success) {
        setData((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, assigned_to: sellerId }
        }))
        onStageChange?.()
      }
    } catch (error) {
      console.error("Erro ao atribuir vendedor:", error)
    } finally {
      setIsAssigningSeller(false)
    }
  }

  const handleStageChange = (newStage: PipelineStage) => {
    startStageTransition(async () => {
      const result = await updatePipelineStage(leadId, newStage)
      if (result.success) {
        // Atualiza localmente ou recarrega
        if (data?.profile) {
          setData((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, pipeline_stage: newStage }
          }))
        }
        onStageChange?.()
        loadData() // Recarrega para atualizar timeline
      }
    })
  }

  if (!open) return null

  const profile = data?.profile || {}
  const stats = data?.stats || {}
  const timeline = data?.timeline || []
  const courses = data?.courses || []

  // Helpers de formatação
  const phoneDigits = profile.whatsapp?.replace(/\D/g, "")
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  // Trial progress calculation
  const daysRemaining = profile.trial_ends_at
    ? Math.max(0, getRemainingTrialDays(profile.trial_ends_at))
    : null

  const trialProgress = (() => {
    if (!profile.trial_started_at || !profile.trial_ends_at) return null
    const startDate = new Date(profile.trial_started_at)
    const endDate = new Date(profile.trial_ends_at)
    const now = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    return Math.round(progress)
  })()

  const isUrgent = daysRemaining !== null && daysRemaining <= 2

  // Get assigned seller info
  const assignedSeller = sellers.find(s => s.id === profile.assigned_to)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 bg-[#020617] border border-[rgba(148,163,184,0.08)] text-[#f8fafc] overflow-hidden shadow-2xl sm:rounded-2xl">
          <div className="flex flex-col h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617]">
            {/* Header com design system refinado */}
            <div className="flex flex-col gap-6 px-8 py-6 border-b border-[rgba(148,163,184,0.08)] bg-[#0a0f1f]/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <DialogTitle className="text-3xl font-heading font-bold text-[#f8fafc] flex items-center gap-4 flex-wrap tracking-tight">
                    {profile.name || leadName || "Lead sem nome"}
                    {profile.plan_type !== "free" && (
                      <Badge variant="secondary" className="px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-medium rounded-full shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                        {profile.plan_type}
                      </Badge>
                    )}
                  </DialogTitle>

                  <div className="flex items-center gap-6 text-sm text-[#94a3b8] flex-wrap">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-800/50">
                      <Mail className="h-4 w-4 text-cyan-500" />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-800/50">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <LeadActionsBar
                    userId={leadId}
                    currentStage={profile.pipeline_stage}
                    email={profile.email}
                    whatsapp={profile.whatsapp || profile.phone}
                    onStageChange={handleStageChange}
                    onAddNote={() => setNotesOpen(true)}
                    onScheduleFollowup={() => setFollowupOpen(true)}
                  />
                </div>
              </div>

              {/* Status Bar unificada e elegante */}
              {(trialProgress !== null || isUrgent) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 items-center">
                  <div className="md:col-span-1 flex flex-col justify-center">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status do Trial</span>
                    <span className={cn(
                      "text-sm font-bold flex items-center gap-2",
                      isUrgent ? "text-rose-400" : "text-cyan-400"
                    )}>
                      {daysRemaining !== null && daysRemaining > 0
                        ? <><Clock3 className="w-4 h-4" /> {daysRemaining} dias restantes</>
                        : daysRemaining === 0
                          ? "⚠️ Expira hoje"
                          : "❌ Expirado"
                      }
                    </span>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 px-1">
                      <span>Início: {profile.trial_started_at ? format(new Date(profile.trial_started_at), "dd/MM", { locale: ptBR }) : "-"}</span>
                      <span>Fim: {profile.trial_ends_at ? format(new Date(profile.trial_ends_at), "dd/MM", { locale: ptBR }) : "-"}</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={cn(
                          "h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]",
                          isUrgent
                            ? "bg-gradient-to-r from-rose-500 to-orange-500"
                            : "bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500"
                        )}
                        style={{ width: `${trialProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#020617]">
                {/* Left Sidebar - Info */}
                <div className="w-full md:w-[320px] lg:w-[350px] border-b md:border-b-0 md:border-r border-slate-800/50 bg-[#050914] overflow-y-auto p-6 space-y-8 flex-shrink-0 custom-scrollbar">
                  {/* Status do Trial */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Status do Trial
                    </h3>
                    <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/60 space-y-4 shadow-sm backdrop-blur-sm">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Início</span>
                        <span className="text-slate-200 font-medium font-mono text-xs bg-slate-800/50 px-2 py-1 rounded">
                          {profile.trial_started_at
                            ? format(new Date(profile.trial_started_at), "dd MMM yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Fim</span>
                        <span className="text-slate-200 font-medium font-mono text-xs bg-slate-800/50 px-2 py-1 rounded">
                          {profile.trial_ends_at
                            ? format(new Date(profile.trial_ends_at), "dd MMM yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-800/60">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Assinatura</span>
                          <Badge variant="outline" className={cn(
                            "border",
                            profile.subscription_status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              profile.subscription_status === 'canceled' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                "bg-slate-800/50 text-slate-400 border-slate-700/50"
                          )}>
                            {profile.subscription_status === 'active' ? 'Ativa' :
                              profile.subscription_status === 'canceled' ? 'Cancelada' :
                                profile.subscription_status || "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Dados Pessoais
                    </h3>
                    <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/60 space-y-4 text-sm shadow-sm backdrop-blur-sm">
                      {profile.profession && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500">Profissão</span>
                          <span className="text-slate-200 font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                            {profile.profession}
                          </span>
                        </div>
                      )}

                      {profile.institution && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500">Instituição</span>
                          <span className="text-slate-200 font-medium flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-cyan-500/70" />
                            {profile.institution}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {profile.state && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-500">Estado</span>
                            <span className="text-slate-200 font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-cyan-500/70" />
                              {profile.state}
                            </span>
                          </div>
                        )}
                        {profile.account_source && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-500">Origem</span>
                            <span className="text-slate-200 font-medium flex items-center gap-2">
                              {profile.account_source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vendedor Responsável */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5" />
                      Vendedor Responsável
                    </h3>
                    <div className="bg-slate-900/40 rounded-xl p-1 border border-slate-800/60 shadow-sm backdrop-blur-sm">
                      <Select
                        value={profile.assigned_to || "none"}
                        onValueChange={(value) => handleAssignSeller(value === "none" ? null : value)}
                        disabled={isAssigningSeller}
                      >
                        <SelectTrigger className="w-full bg-transparent border-none text-slate-200 h-10 hover:bg-slate-800/30 transition-colors focus:ring-0">
                          <SelectValue placeholder="Selecionar vendedor">
                            {profile.assigned_to && assignedSeller ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                                  {assignedSeller.name?.charAt(0) || "V"}
                                </div>
                                <span>{assignedSeller.name || assignedSeller.email?.split("@")[0]}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Atribuir vendedor...</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-slate-800">
                          <SelectItem
                            value="none"
                            className="text-slate-400 hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Remover atribuição</span>
                            </div>
                          </SelectItem>
                          {sellers.map((seller) => (
                            <SelectItem
                              key={seller.id}
                              value={seller.id}
                              className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
                                  {seller.name?.charAt(0) || "V"}
                                </div>
                                <span>{seller.name || seller.email?.split("@")[0]}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sellers.length === 0 && (
                        <p className="text-xs text-slate-500 px-3 pb-2">
                          Nenhum vendedor cadastrado.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Métricas
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 shadow-sm backdrop-blur-sm group hover:border-emerald-500/30 transition-colors">
                        <span className="text-xs text-slate-500 block mb-2 font-medium">Total Gasto</span>
                        <span className="text-xl font-bold text-emerald-400 tracking-tight group-hover:text-emerald-300 transition-colors">
                          {formatCurrency(stats.total_spent)}
                        </span>
                      </div>
                      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 shadow-sm backdrop-blur-sm group hover:border-cyan-500/30 transition-colors">
                        <span className="text-xs text-slate-500 block mb-2 font-medium">Cursos</span>
                        <span className="text-xl font-bold text-cyan-400 tracking-tight group-hover:text-cyan-300 transition-colors">
                          {stats.completed_courses}<span className="text-slate-600 text-sm font-normal">/{stats.total_courses}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Tabs */}
                <div className="flex-1 flex flex-col bg-[#020617]/30">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-8 pt-6 border-b border-slate-800/40 bg-[#0a0f1f]/30 backdrop-blur-sm">
                      <TabsList className="bg-transparent h-auto p-0 gap-8 w-full justify-start">
                        <TabsTrigger
                          value="overview"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 pb-4 text-slate-500 data-[state=active]:text-cyan-400 transition-all font-medium hover:text-slate-300"
                        >
                          <div className="flex items-center gap-2.5">
                            <History className="w-4 h-4" />
                            Timeline & Atividades
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="courses"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 pb-4 text-slate-500 data-[state=active]:text-cyan-400 transition-all font-medium hover:text-slate-300"
                        >
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4" />
                            Cursos
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                      <TabsContent value="overview" className="h-full m-0 data-[state=active]:flex flex-col absolute inset-0">
                        <ScrollArea className="flex-1 h-full">
                          <div className="p-8 max-w-4xl mx-auto">
                            <LeadTimeline events={timeline} />
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="courses" className="h-full m-0 absolute inset-0">
                        <ScrollArea className="h-full p-8">
                          {courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                              <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mb-4">
                                <BookOpen className="h-8 w-8 opacity-40" />
                              </div>
                              <p className="text-sm font-medium">Nenhum curso iniciado</p>
                            </div>
                          ) : (
                            <div className="grid gap-4 max-w-3xl mx-auto">
                              {courses.map((course: any) => (
                                <div key={course.id} className="group flex gap-5 p-5 rounded-2xl border border-slate-800/50 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all duration-300">
                                  {course.course?.thumbnail && (
                                    <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 shadow-lg border border-slate-800/50 group-hover:scale-[1.02] transition-transform">
                                      <img src={course.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-heading font-semibold text-slate-200 text-lg truncate group-hover:text-cyan-400 transition-colors">{course.course?.title}</h4>

                                    <div className="flex items-center gap-4 mt-3">
                                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                        <div
                                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700 ease-out relative overflow-hidden"
                                          style={{ width: `${course.progress}%` }}
                                        >
                                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-cyan-500 w-12 text-right font-mono">
                                        {course.progress}%
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                                      <Clock3 className="w-3 h-3" />
                                      Último acesso {formatDistanceToNow(new Date(course.updated_at), { locale: ptBR, addSuffix: true })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FollowupScheduler
        open={followupOpen}
        onOpenChange={setFollowupOpen}
        userId={leadId}
        onSuccess={() => loadData()}
      />

      <NotesModal
        open={notesOpen}
        onOpenChange={(open) => {
          setNotesOpen(open)
          if (!open) loadData()
        }}
        userId={leadId}
        userName={leadName}
      />
    </>
  )
}

