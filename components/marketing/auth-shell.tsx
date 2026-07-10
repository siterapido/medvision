import type { ReactNode } from "react"

import { LandingHero } from "@/components/marketing/landing-hero"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  children: ReactNode
  className?: string
}

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div
      data-surface="product"
      className={cn(
        "relative flex min-h-screen flex-col overflow-x-hidden bg-paper text-ink",
        className,
      )}
    >
      {/* Atmosfera consultório: ardósia sutil, sem glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_15%_20%,oklch(0.94_0.02_255)_0%,transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_80%,oklch(0.96_0.01_250)_0%,transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(oklch(0.45_0.015_255)_1px,transparent_1px),linear-gradient(90deg,oklch(0.45_0.015_255)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-6 py-12 sm:px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:py-16">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:fill-mode-both lg:w-[55%] lg:shrink-0">
          <LandingHero />
        </div>

        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-500 motion-safe:delay-100 motion-safe:fill-mode-both lg:w-[45%]">
          {children}
        </div>
      </div>
    </div>
  )
}
