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
import { getLeadDetails, updatePipelineStage } from "@/app/actions/pipeline"
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

  useEffect(() => {
    if (open && leadId) {
      loadData()
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-[#030711] border-slate-800 text-slate-200 overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    {profile.name || leadName || "Lead sem nome"}
                    {profile.plan_type !== "free" && (
                      <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                        {profile.plan_type}
                      </Badge>
                    )}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
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
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Info */}
                <div className="w-1/3 border-r border-slate-800 bg-slate-900/20 overflow-y-auto p-6 space-y-6">
                  {/* Status do Trial */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Status do Trial
                    </h3>
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Início</span>
                        <span className="text-slate-200">
                          {profile.trial_started_at
                            ? format(new Date(profile.trial_started_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Fim</span>
                        <span className="text-slate-200">
                          {profile.trial_ends_at
                            ? format(new Date(profile.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                         <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Status</span>
                          <Badge variant="outline" className={cn(
                            "border-0",
                            profile.subscription_status === 'active' ? "bg-green-500/10 text-green-400" :
                            profile.subscription_status === 'canceled' ? "bg-red-500/10 text-red-400" :
                            "bg-slate-800 text-slate-400"
                          )}>
                            {profile.subscription_status || "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Dados Pessoais
                    </h3>
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-2 text-sm">
                      {profile.profession && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">Profissão</span>
                          <span className="text-slate-200">{profile.profession}</span>
                        </div>
                      )}
                      {profile.institution && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">Instituição</span>
                          <span className="text-slate-200 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-slate-500" />
                            {profile.institution}
                          </span>
                        </div>
                      )}
                      {profile.state && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">Estado</span>
                          <span className="text-slate-200 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {profile.state}
                          </span>
                        </div>
                      )}
                      {profile.account_source && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">Origem</span>
                          <span className="text-slate-200">{profile.account_source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Métricas
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 block mb-1">Total Gasto</span>
                        <span className="text-sm font-medium text-green-400">
                          {formatCurrency(stats.total_spent)}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 block mb-1">Cursos</span>
                        <span className="text-sm font-medium text-cyan-400">
                          {stats.completed_courses}/{stats.total_courses}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Tabs */}
                <div className="flex-1 flex flex-col bg-slate-950/30">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-6 pt-4 border-b border-slate-800">
                      <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger 
                          value="overview" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-cyan-400 transition-all"
                        >
                          Timeline & Atividades
                        </TabsTrigger>
                        <TabsTrigger 
                          value="courses" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-cyan-400 transition-all"
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
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                              <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                              <p>Nenhum curso iniciado</p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {courses.map((course: any) => (
                                <div key={course.id} className="flex gap-4 p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                                  {course.course?.thumbnail && (
                                    <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                                      <img src={course.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-200 truncate">{course.course?.title}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-cyan-500 transition-all duration-500" 
                                          style={{ width: `${course.progress}%` }} 
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-cyan-400 w-8 text-right">
                                        {course.progress}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
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

