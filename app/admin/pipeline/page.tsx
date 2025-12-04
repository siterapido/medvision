import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { PipelineKanbanBoard } from "@/components/admin/pipeline/pipeline-kanban-board"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Pipeline de Conversão | Admin",
  description: "Acompanhe leads, organize follow-ups e acompanhe conversões",
}

async function PipelineContent() {
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
      "id, name, email, whatsapp, profession, company, institution, plan_type, subscription_status, trial_started_at, trial_ends_at, trial_used, created_at, pipeline_stage"
    )
    .or(
      "trial_started_at.not.is.null,trial_ends_at.not.is.null,trial_used.eq.true,plan_type.neq.free,pipeline_stage.not.is.null"
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400 text-sm">Carregando pipeline de conversão...</p>
      </div>
    </div>
  )
}

export default function AdminPipelinePage() {
  return (
    <div className="w-full space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Pipeline de Conversão</h1>
        <p className="text-slate-400">
          Acompanhe leads no funil de conversão, organize follow-ups e visualize o progresso das vendas.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <PipelineContent />
      </Suspense>
    </div>
  )
}


