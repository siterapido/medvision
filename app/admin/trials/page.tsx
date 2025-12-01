import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { TrialFormsManager } from "@/components/admin/trial-forms-manager"

export const metadata = {
  title: "Links de Trials | Admin",
  description: "Gerencie e compartilhe formulários de trial",
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400 text-sm">Carregando links de trials...</p>
      </div>
    </div>
  )
}

export default function AdminTrialsPage() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Links de formulário de trial</h1>
        <p className="text-slate-400">
          Gere e copie rapidamente os formulários de 1, 3, 7 e 30 dias.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <TrialFormsManager />
      </Suspense>
    </div>
  )
}
