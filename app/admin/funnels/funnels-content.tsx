"use client"

import { useCallback, useEffect, useState } from "react"
import { FunnelDashboard } from "@/components/admin/funnels/funnel-dashboard"
import { getFunnelMetrics } from "@/app/actions/funnels"
import type { FunnelCardData } from "@/lib/types/funnel"

export function FunnelsContent() {
  const [funnels, setFunnels] = useState<FunnelCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFunnels = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getFunnelMetrics()
      if (result.success) {
        setFunnels(result.data)
      } else {
        setError(result.message || "Erro ao carregar funis")
      }
    } catch (err) {
      console.error("Error fetching funnels:", err)
      setError("Erro ao carregar funis")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFunnels()
  }, [fetchFunnels])

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6">
        <p className="font-semibold text-red-100">Erro ao carregar funis</p>
        <p className="text-sm text-red-200/80">{error}</p>
      </div>
    )
  }

  return (
    <FunnelDashboard
      funnels={funnels}
      isLoading={isLoading}
      onRefresh={fetchFunnels}
    />
  )
}
