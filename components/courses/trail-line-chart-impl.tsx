"use client"

import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts"

type Item = { completed: boolean; order_index?: number | null }

export default function TrailLineChartImpl({ items }: { items: Item[] }) {
  const points = items.map((_, i) => ({ x: i + 1, y: i + 1 }))
  const completedCount = items.filter((i) => i.completed).length
  const completedPoints = points.map((p, i) => ({ ...p, yc: i < completedCount ? p.y : null }))
  const remainingPoints = points.map((p, i) => ({ ...p, yr: i >= completedCount ? p.y : null }))

  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <Tooltip cursor={false} formatter={(value) => [`${value} aulas`, "Trilha"]} labelFormatter={(label) => `Aula ${label}`} />
          <Line type="monotone" dataKey="yc" data={completedPoints} stroke="var(--color-chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="yr" data={remainingPoints} stroke="var(--color-chart-4)" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
