"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

type Item = { completed: boolean; order_index?: number | null }

const Chart = dynamic(() => import("./trail-line-chart-impl"), {
  ssr: false,
  loading: () => <Skeleton className="h-14 w-full" />
})

export function TrailLineChart(props: { items: Item[] }) {
  return <Chart {...props} />
}
