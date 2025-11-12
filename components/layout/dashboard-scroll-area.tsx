"use client"

import type React from "react"

import { cn } from "@/lib/utils"

export const dashboardScrollAreaClassName =
  "dashboard-scroll-area flex flex-1 min-h-0 max-h-full w-full flex-col overflow-y-auto px-4 pt-6 pb-0 scroll-smooth"
export const dashboardScrollAreaRole = "region"
export const dashboardScrollAreaLabel = "Conteúdo da dashboard"
export const dashboardScrollAreaTestId = "dashboard-scroll-area"
export const dashboardScrollAreaStyle: React.CSSProperties = {
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
}

interface DashboardScrollAreaProps {
  children: React.ReactNode
  className?: string
}

export function DashboardScrollArea({ children, className }: DashboardScrollAreaProps) {
  return (
    <div
      className={cn(dashboardScrollAreaClassName, className)}
      role={dashboardScrollAreaRole}
      aria-label={dashboardScrollAreaLabel}
      data-testid={dashboardScrollAreaTestId}
      style={dashboardScrollAreaStyle}
    >
      {children}
    </div>
  )
}
