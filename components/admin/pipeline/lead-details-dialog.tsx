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
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 bg-[#020617] border-[rgba(148,163,184,0.12)] text-[#f8fafc] overflow-hidden shadow-2xl">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header com design system */}
            <div className="flex flex-col gap-4 px-6 py-5 border-b border-[rgba(148,163,184,0.08)] bg-[#0a0f1f]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="text-2xl font-semibold text-[#f8fafc] flex items-center gap-3 flex-wrap">
                    {profile.name || leadName || "Lead sem nome"}
                    {profile.plan_type !== "free" && (
                      <Badge variant="secondary" className="bg-[rgba(139,92,246,0.12)] text-[#c4b5fd] border border-[rgba(139,92,246,0.2)] text-xs">
                        {profile.plan_type}
                      </Badge>
                    )}
                  </DialogTitle>
                  <div className="flex items-center gap-4 text-sm text-[#94a3b8] flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-[#64748b]" />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-[#64748b]" />
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>

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

              {/* Prominent Trial Progress Bar */}
              {trialProgress !== null && (
                <div className="space-y-2 bg-[#0f172a] rounded-xl p-4 border border-[rgba(148,163,184,0.08)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8] font-medium">Progresso do Trial</span>
                    <span className={cn(
                      "font-semibold",
                      isUrgent ? "text-[#f87171]" : "text-[#06b6d4]"
                    )}>
                      {daysRemaining !== null && daysRemaining > 0
                        ? `${daysRemaining} dias restantes`
                        : daysRemaining === 0
                        ? "Expira hoje"
                        : "Trial expirado"}
                    </span>
                  </div>
                  <div className="h-3 bg-[#131d37] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isUrgent
                          ? "bg-gradient-to-r from-[#f87171] to-[#fca5a5]"
                          : "bg-gradient-to-r from-[#0891b2] to-[#06b6d4]"
                      )}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>
                      {profile.trial_started_at
                        ? format(new Date(profile.trial_started_at), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </span>
                    <span>
                      {profile.trial_ends_at
                        ? format(new Date(profile.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Sidebar - Info */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[rgba(148,163,184,0.08)] bg-[#0a0f1f] overflow-y-auto p-6 space-y-6">
                  {/* Status do Trial */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Status do Trial
                    </h3>
                    <div className="bg-[#0f172a] rounded-xl p-4 border border-[rgba(148,163,184,0.08)] space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#94a3b8]">Início</span>
                        <span className="text-[#f8fafc] font-medium">
                          {profile.trial_started_at
                            ? format(new Date(profile.trial_started_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#94a3b8]">Fim</span>
                        <span className="text-[#f8fafc] font-medium">
                          {profile.trial_ends_at
                            ? format(new Date(profile.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-[rgba(148,163,184,0.08)]">
                         <div className="flex justify-between items-center text-sm">
                          <span className="text-[#94a3b8]">Status</span>
                          <Badge variant="outline" className={cn(
                            "border",
                            profile.subscription_status === 'active' ? "bg-[rgba(52,211,153,0.12)] text-[#34d399] border-[rgba(52,211,153,0.3)]" :
                            profile.subscription_status === 'canceled' ? "bg-[rgba(248,113,113,0.12)] text-[#f87171] border-[rgba(248,113,113,0.3)]" :
                            "bg-[#0a0f1f] text-[#94a3b8] border-[rgba(148,163,184,0.2)]"
                          )}>
                            {profile.subscription_status || "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados Pessoais
                    </h3>
                    <div className="bg-[#0f172a] rounded-xl p-4 border border-[rgba(148,163,184,0.08)] space-y-3 text-sm">
                      {profile.profession && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[#64748b]">Profissão</span>
                          <span className="text-[#f8fafc] font-medium">{profile.profession}</span>
                        </div>
                      )}
                      {profile.institution && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[#64748b]">Instituição</span>
                          <span className="text-[#f8fafc] font-medium flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-[#06b6d4]" />
                            {profile.institution}
                          </span>
                        </div>
                      )}
                      {profile.state && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[#64748b]">Estado</span>
                          <span className="text-[#f8fafc] font-medium flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#06b6d4]" />
                            {profile.state}
                          </span>
                        </div>
                      )}
                      {profile.account_source && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[#64748b]">Origem</span>
                          <span className="text-[#f8fafc] font-medium">{profile.account_source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vendedor Responsável */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Vendedor Responsável
                    </h3>
                    <div className="bg-[#0f172a] rounded-xl p-4 border border-[rgba(148,163,184,0.08)]">
                      <Select
                        value={profile.assigned_to || "none"}
                        onValueChange={(value) => handleAssignSeller(value === "none" ? null : value)}
                        disabled={isAssigningSeller}
                      >
                        <SelectTrigger className="w-full bg-[#131d37] border-[rgba(148,163,184,0.12)] text-[#f8fafc] h-10">
                          <SelectValue placeholder="Selecionar vendedor">
                            {profile.assigned_to && assignedSeller ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#8b5cf6]" />
                                <span>{assignedSeller.name || assignedSeller.email?.split("@")[0]}</span>
                              </div>
                            ) : (
                              <span className="text-[#64748b]">Nenhum vendedor</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-[rgba(148,163,184,0.12)]">
                          <SelectItem
                            value="none"
                            className="text-[#94a3b8] hover:bg-[#131d37] focus:bg-[#131d37] cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Nenhum vendedor</span>
                            </div>
                          </SelectItem>
                          {sellers.map((seller) => (
                            <SelectItem
                              key={seller.id}
                              value={seller.id}
                              className="text-[#f8fafc] hover:bg-[#131d37] focus:bg-[#131d37] cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#8b5cf6]" />
                                <span>{seller.name || seller.email?.split("@")[0]}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sellers.length === 0 && (
                        <p className="text-xs text-[#64748b] mt-2">
                          Nenhum vendedor cadastrado no sistema.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Métricas
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0f172a] p-4 rounded-xl border border-[rgba(148,163,184,0.08)]">
                        <span className="text-xs text-[#64748b] block mb-1.5">Total Gasto</span>
                        <span className="text-base font-semibold text-[#34d399]">
                          {formatCurrency(stats.total_spent)}
                        </span>
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-xl border border-[rgba(148,163,184,0.08)]">
                        <span className="text-xs text-[#64748b] block mb-1.5">Cursos</span>
                        <span className="text-base font-semibold text-[#06b6d4]">
                          {stats.completed_courses}/{stats.total_courses}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Tabs */}
                <div className="flex-1 flex flex-col bg-[#020617]">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-6 pt-5 border-b border-[rgba(148,163,184,0.08)]">
                      <TabsList className="bg-transparent h-auto p-0 gap-8">
                        <TabsTrigger
                          value="overview"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#06b6d4] rounded-none px-0 pb-3 text-[#94a3b8] data-[state=active]:text-[#06b6d4] transition-all font-medium"
                        >
                          Timeline & Atividades
                        </TabsTrigger>
                        <TabsTrigger
                          value="courses"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#06b6d4] rounded-none px-0 pb-3 text-[#94a3b8] data-[state=active]:text-[#06b6d4] transition-all font-medium"
                        >
                          Cursos em Andamento
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="overview" className="h-full m-0">
                        <ScrollArea className="h-full p-6">
                          <LeadTimeline events={timeline} />
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="courses" className="h-full m-0">
                        <ScrollArea className="h-full p-6">
                          {courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
                              <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                              <p className="text-sm">Nenhum curso iniciado</p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {courses.map((course: any) => (
                                <div key={course.id} className="flex gap-4 p-4 rounded-xl border border-[rgba(148,163,184,0.08)] bg-[#0f172a] hover:border-[rgba(148,163,184,0.12)] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
                                  {course.course?.thumbnail && (
                                    <div className="w-28 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-[#131d37] border border-[rgba(148,163,184,0.08)]">
                                      <img src={course.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-[#f8fafc] truncate">{course.course?.title}</h4>
                                    <div className="flex items-center gap-3 mt-3">
                                      <div className="flex-1 h-2 bg-[#131d37] rounded-full overflow-hidden border border-[rgba(148,163,184,0.08)]">
                                        <div
                                          className="h-full bg-gradient-to-r from-[#0891b2] to-[#06b6d4] transition-all duration-500"
                                          style={{ width: `${course.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-[#06b6d4] w-10 text-right">
                                        {course.progress}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#64748b] mt-2">
                                      Último acesso {formatDistanceToNow(new Date(course.updated_at), { locale: ptBR, addSuffix: true })}
                                    </p>
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

