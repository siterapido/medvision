"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Importação dinâmica com SSR desativado para gráficos (Recharts depende de window/DOM)
const Chart = dynamic(() => import("./course-sparkline-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-10 w-full" />
})

export function CourseSparkline(props: { lessonsCount: number; progress: number }) {
  return <Chart {...props} />
}
