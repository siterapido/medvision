"use client"

import type React from "react"

export const appScrollAreaClassName = "app-scroll-region scroll-smooth"
export const appScrollAreaRole = "region"
export const appScrollAreaLabel = "Conteúdo principal do site"
export const appScrollAreaTabIndex = -1
export const appScrollAreaTestId = "app-scroll-area"
export const appScrollAreaStyle: React.CSSProperties = {
  WebkitOverflowScrolling: "touch",
}

interface AppScrollAreaProps {
  children: React.ReactNode
}

export function AppScrollArea({ children }: AppScrollAreaProps) {
  return (
    <div
      className={appScrollAreaClassName}
      role={appScrollAreaRole}
      aria-label={appScrollAreaLabel}
      tabIndex={appScrollAreaTabIndex}
      style={appScrollAreaStyle}
      data-testid={appScrollAreaTestId}
    >
      {children}
    </div>
  )
}
