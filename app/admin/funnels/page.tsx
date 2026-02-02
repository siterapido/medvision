import { Suspense } from "react"
import { Loader2, LayoutGrid } from "lucide-react"

import { FunnelsContent } from "./funnels-content"

export const metadata = {
  title: "Funis de Conversao | Admin",
  description: "Gerencie e acompanhe seus funis de conversao de leads",
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Carregando funis...</p>
      </div>
    </div>
  )
}

export default function AdminFunnelsPage() {
  return (
    <div className="w-full space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Funis de Conversao
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe e gerencie seus funis de vendas e conversao
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingState />}>
        <FunnelsContent />
      </Suspense>
    </div>
  )
}
