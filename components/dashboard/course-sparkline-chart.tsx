"use client"

import { ResponsiveContainer, LineChart, Line } from "recharts"

export default function CourseSparklineChart({ lessonsCount, progress }: { lessonsCount: number; progress: number }) {
  const n = Math.max(lessonsCount || 0, 1)
  const points = Array.from({ length: n }, (_, i) => ({ x: i + 1, y: i + 1 }))
  const completed = Math.round(Math.min(Math.max(progress, 0), 100) / 100 * n)
  const completedPoints = points.map((p, i) => ({ ...p, yc: i < completed ? p.y : null }))
  const remainingPoints = points.map((p, i) => ({ ...p, yr: i >= completed ? p.y : null }))

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line type="monotone" dataKey="yc" data={completedPoints} stroke="var(--color-chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="yr" data={remainingPoints} stroke="var(--color-chart-4)" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
