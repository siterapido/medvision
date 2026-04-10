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

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]

export function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname() ?? "/"
  const showLandingShell = pathname === "/"
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isChatOrArtifactRoute =
    pathname.startsWith("/dashboard/odonto-vision") ||
    pathname.includes("/dashboard/pesquisas") ||
    pathname.includes("/dashboard/resumos") ||
    pathname.includes("/dashboard/questionarios") ||
    pathname.includes("/dashboard/flashcards") ||
    pathname.includes("/dashboard/mindmaps") ||
    pathname.includes("/dashboard/escritor") ||
    pathname.startsWith("/admin")

  // Auth routes: full height, scrollable, no sidebar constraints
  if (isAuthRoute) {
    return (
      <div className="app-frame flex flex-col bg-session-landing text-white min-h-screen overflow-y-auto">
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      "app-frame flex flex-col bg-session-landing text-white",
      showLandingShell ? "min-h-screen landing-scroll" : "h-screen overflow-hidden"
    )}>
      <div className={cn("flex flex-1", showLandingShell ? "flex-col" : "flex-row overflow-hidden")}>
        {showLandingShell ? (
          <AppScrollArea className="flex-1 landing-scroll">
            {children}
            <LandingFooter />
          </AppScrollArea>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
