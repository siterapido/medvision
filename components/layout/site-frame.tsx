"use client"

import { usePathname } from "next/navigation"
import type React from "react"

import { AppScrollArea } from "./app-scroll-area"
import { LandingFooter } from "./landing-footer"
import { LandingHeader } from "./landing-header"

interface SiteFrameProps {
  children: React.ReactNode
}

export function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname() ?? "/"
  const showLandingShell = pathname === "/"

  return (
    <div className="app-frame flex min-h-screen flex-col bg-session-landing text-white">
      {showLandingShell ? <LandingHeader /> : null}
      <AppScrollArea className={showLandingShell ? "" : "flex-1"}>
        {children}
      </AppScrollArea>
      {showLandingShell ? <LandingFooter /> : null}
    </div>
  )
}
