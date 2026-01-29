"use client"

import { usePathname } from "next/navigation"
import type React from "react"

import { AppScrollArea } from "./app-scroll-area"
import { LandingFooter } from "./landing-footer"
import { LandingHeader } from "./landing-header"

import { cn } from "@/lib/utils"

interface SiteFrameProps {
  children: React.ReactNode
}

export function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname() ?? "/"
  const showLandingShell = pathname === "/"
  const isChatOrArtifactRoute =
    pathname === "/dashboard/chat" ||
    pathname.includes("/dashboard/pesquisas") ||
    pathname.includes("/dashboard/resumos") ||
    pathname.includes("/dashboard/questionarios") ||
    pathname.includes("/dashboard/flashcards") ||
    pathname.includes("/dashboard/mindmaps") ||
    pathname.includes("/dashboard/escritor") ||
    pathname.startsWith("/admin")

  return (
    <div className={cn(
      "app-frame flex min-h-screen flex-col bg-session-landing text-white",
      showLandingShell && "landing-scroll"
    )}>
      <div className={cn("flex flex-1", showLandingShell ? "flex-col" : "flex-row overflow-hidden")}>
        <AppScrollArea className={cn("flex-1", showLandingShell && "landing-scroll")}>
          {children}
          {showLandingShell ? <LandingFooter /> : null}
        </AppScrollArea>
      </div>
    </div>
  )
}
