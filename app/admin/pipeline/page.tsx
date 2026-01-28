import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { PipelineKanbanBoard } from "@/components/admin/pipeline/pipeline-kanban-board"
import { ColdLeadsKanbanBoard } from "@/components/admin/pipeline/cold-leads-kanban-board"
import { PipelineTabs } from "@/components/admin/pipeline/pipeline-tabs"
import { createClient } from "@/lib/supabase/server"
import { getColdLeads } from "@/app/actions/leads"

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

  const { data: leads, error } = await supabase
    .from("profiles")
    .select(
      "id, name, email, role, trial_started_at, trial_ends_at, trial_used, created_at, pipeline_stage"
    )
    .neq("role", "admin")
    .neq("role", "vendedor")
    .is("deleted_at", null)
    .or(
      "trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,pipeline_stage.not.is.null"
    )
    .order("trial_started_at", { ascending: false, nullsLast: true })
    .limit(400)

  if (error) {
    console.error("Erro ao buscar leads do pipeline:", error)
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-semibold">Não foi possível carregar o pipeline.</p>
        <p className="text-sm text-red-200/80">{error.message}</p>
      </div>
    )
  }

  return <PipelineKanbanBoard leads={leads || []} />
}

async function ColdLeadsContent() {
  const result = await getColdLeads()

  if (!result.success) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-semibold">Não foi possível carregar os leads frios.</p>
        <p className="text-sm text-red-200/80">{result.message}</p>
      </div>
    )
  }

  return <ColdLeadsKanbanBoard leads={result.data} />
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
      />
    </div>
  )
}
