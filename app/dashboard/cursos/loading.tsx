import { Skeleton } from "@/components/ui/skeleton"

export default function CursosLoading() {
  return (
    <div className="flex flex-col space-y-8 p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
        <Skeleton className="h-10 w-64 rounded-lg bg-slate-800" />
      </div>

      <div className="space-y-6">
        {/* Filter Skeleton */}
        <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-full bg-slate-800" />
            <Skeleton className="h-10 w-32 rounded-full bg-slate-800" />
            <Skeleton className="h-10 w-32 rounded-full bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-800" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded bg-slate-800" />
                <Skeleton className="h-4 w-1/2 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
