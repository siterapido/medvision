import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Skeleton - Visible only on desktop */}
      <div className="hidden md:flex w-[240px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="p-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 px-4 space-y-4 py-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Header Skeleton */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6">
          <Skeleton className="h-8 w-48 md:hidden" /> {/* Mobile logo placeholder */}
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24 hidden md:block" />
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    </div>
  )
}
