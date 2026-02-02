import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { PipelineKanbanBoard } from "@/components/admin/pipeline/pipeline-kanban-board"
import { ColdLeadsKanbanBoard } from "@/components/admin/pipeline/cold-leads-kanban-board"
import { Trial7DaysView } from "@/components/admin/pipeline/trial-7-days-view"
import { PipelineTabs } from "@/components/admin/pipeline/pipeline-tabs"
import { createClient } from "@/lib/supabase/server"
import { getColdLeadsWithSellers } from "@/app/actions/leads"

export const metadata = {
  title: "Pipeline de Conversão | Admin",
  description: "Acompanhe leads, organize follow-ups e acompanhe conversões",
}

async function TrialPipelineContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white">Acesso necessário</p>
          <p className="text-sm text-slate-300">
            Faça login novamente para acessar o pipeline.
          </p>
        </div>
      </div>
    )
  }

  // Busca leads do pipeline com limite para evitar timeout
  // After migration 20260202000001, all non-admin/vendedor profiles have trial_started_at populated
  const { data: leads, error, count } = await supabase
    .from("profiles")
    .select(`
      id, name, email, role, trial_started_at, trial_ends_at, trial_used, created_at, pipeline_stage,
      assigned_to
    `, { count: "exact" })
    .neq("role", "admin")
    .neq("role", "vendedor")
    .is("deleted_at", null)
    .limit(1000)
    .order("trial_started_at", { ascending: false, nullsFirst: false })

  // Fetch seller info separately for profiles with assigned_to
  const assignedToIds = [...new Set((leads || []).filter(l => l.assigned_to).map(l => l.assigned_to))]
  let sellersMap: Record<string, { id: string; name: string | null; email: string | null }> = {}

  if (assignedToIds.length > 0) {
    const { data: sellers } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", assignedToIds)

    sellers?.forEach(s => { sellersMap[s.id] = s })
  }

  if (error) {
    console.error("Erro ao buscar leads do pipeline:", error)
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-semibold">Não foi possível carregar o pipeline.</p>
        <p className="text-sm text-red-200/80">{error.message}</p>
      </div>
    )
  }

  const normalizedLeads = (leads || []).map((lead: any) => ({
    ...lead,
    assigned_seller: lead.assigned_to ? sellersMap[lead.assigned_to] || null : null,
  }))

  return <PipelineKanbanBoard leads={normalizedLeads} totalCount={count || normalizedLeads.length} />
}

async function Trial7DaysContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-white">Acesso necessario</p>
          <p className="text-sm text-slate-300">
            Faca login novamente para acessar a visualizacao.
          </p>
        </div>
      </div>
    )
  }

  // Fetch trial users - all non-admin/vendedor profiles have trial_started_at after migration
  const { data: leads, error } = await supabase
    .from("profiles")
    .select(`
      id, name, email, role, trial_started_at, trial_ends_at, trial_used, created_at, pipeline_stage,
      plan_type, subscription_status, last_active_at, assigned_to
    `)
    .neq("role", "admin")
    .neq("role", "vendedor")
    .is("deleted_at", null)
    .limit(1000)
    .order("trial_started_at", { ascending: false })

  // Fetch seller info separately
  const assignedToIds = [...new Set((leads || []).filter(l => l.assigned_to).map(l => l.assigned_to))]
  let sellersMap: Record<string, { id: string; name: string | null; email: string | null }> = {}

  if (assignedToIds.length > 0) {
    const { data: sellers } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", assignedToIds)

    sellers?.forEach(s => { sellersMap[s.id] = s })
  }

  if (error) {
    console.error("Erro ao buscar leads do trial:", error)
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-semibold">Nao foi possivel carregar a visualizacao.</p>
        <p className="text-sm text-red-200/80">{error.message}</p>
      </div>
    )
  }

  const normalizedLeads = (leads || []).map((lead: any) => ({
    ...lead,
    assigned_seller: lead.assigned_to ? sellersMap[lead.assigned_to] || null : null,
  }))

  return <Trial7DaysView leads={normalizedLeads} />
}

async function ColdLeadsContent() {
  const result = await getColdLeadsWithSellers()

  if (!result.success) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-semibold">Nao foi possivel carregar os leads frios.</p>
        <p className="text-sm text-red-200/80">{result.message}</p>
      </div>
    )
  }

  const normalizedLeads = (result.data || []).map((lead: any) => ({
    ...lead,
    assigned_seller: Array.isArray(lead.assigned_seller) ? lead.assigned_seller[0] : lead.assigned_seller,
  }))

  return <ColdLeadsKanbanBoard leads={normalizedLeads} />
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400 text-sm">Carregando pipeline...</p>
      </div>
    </div>
  )
}

export default function AdminPipelinePage() {
  return (
    <div className="w-full h-full flex flex-col">
      <PipelineTabs
        coldLeadsTab={
          <Suspense fallback={<LoadingState />}>
            <ColdLeadsContent />
          </Suspense>
        }
        trialPipelineTab={
          <Suspense fallback={<LoadingState />}>
            <TrialPipelineContent />
          </Suspense>
        }
        trial7DaysTab={
          <Suspense fallback={<LoadingState />}>
            <Trial7DaysContent />
          </Suspense>
        }
      />
    </div>
  )
}
