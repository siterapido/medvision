import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LoadingMateriais() {
  return (
    <DashboardScrollArea>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-5 w-80 rounded bg-slate-200" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-slate-200 bg-white">
              <div className="relative h-48 bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="h-4 w-64 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <Badge className="h-5 w-16 bg-slate-200" />
                  <Badge className="h-5 w-20 bg-slate-200" />
                </div>
                <div className="h-4 w-full rounded bg-slate-200" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardScrollArea>
  )
}

