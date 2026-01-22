import { Skeleton } from "@/components/ui/skeleton"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

export default function OdontoFlixLoading() {
    return (
        <DashboardScrollArea className="!p-0 bg-slate-950">
            <div className="flex flex-col space-y-12 pb-20">
                {/* Hero Skeleton */}
                <Skeleton className="h-[80vh] w-full bg-slate-900 md:h-[90vh]" />

                {/* Carousel Rows Skeletons */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4 px-4 md:px-10">
                        <Skeleton className="h-8 w-48 bg-slate-900" />
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4, 5].map((j) => (
                                <Skeleton
                                    key={j}
                                    className="aspect-[16/9] w-[280px] flex-shrink-0 bg-slate-900 md:w-[320px]"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </DashboardScrollArea>
    )
}
