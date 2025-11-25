"use client"

import type React from "react"

export const appScrollAreaClassName = "app-scroll-region scroll-smooth w-full flex-1"
export const appScrollAreaRole = "region"
export const appScrollAreaLabel = "Conteúdo principal do site"
export const appScrollAreaTabIndex = -1
export const appScrollAreaTestId = "app-scroll-area"
export const appScrollAreaStyle: React.CSSProperties = {
  WebkitOverflowScrolling: "touch",
}

interface AppScrollAreaProps {
  children: React.ReactNode
  className?: string
}

export function AppScrollArea({ children, className }: AppScrollAreaProps) {
  const combinedClassName = className
    ? `${appScrollAreaClassName} ${className}`
    : appScrollAreaClassName

  return (
    <div
      className={combinedClassName}
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
