"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { getAgentTheme, getAgentCSSVars } from "@/lib/agent-themes"
import { cn } from "@/lib/utils"

interface AgentIdentityProps {
  className?: string
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

// Mapeamento estático para Tailwind reconhecer as classes
const themeClasses: Record<string, { 
  iconBg: string, 
  iconText: string, 
  textGradient: string,
  border: string,
  glow: string
}> = {
  cyan: { 
    iconBg: "bg-cyan-500/10", 
    iconText: "text-cyan-600 dark:text-cyan-400", 
    textGradient: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-500/20",
    glow: "shadow-none"
  },
  blue: { 
    iconBg: "bg-blue-500/10", 
    iconText: "text-blue-600 dark:text-blue-400", 
    textGradient: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/20",
    glow: "shadow-none"
  },
  purple: { 
    iconBg: "bg-purple-500/10", 
    iconText: "text-purple-600 dark:text-purple-400", 
    textGradient: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/20",
    glow: "shadow-none"
  },
  emerald: { 
    iconBg: "bg-emerald-500/10", 
    iconText: "text-emerald-600 dark:text-emerald-400", 
    textGradient: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-none"
  },
  amber: { 
    iconBg: "bg-amber-500/10", 
    iconText: "text-amber-600 dark:text-amber-400", 
    textGradient: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
    glow: "shadow-none"
  },
  rose: { 
    iconBg: "bg-rose-500/10", 
    iconText: "text-rose-600 dark:text-rose-400", 
    textGradient: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/20",
    glow: "shadow-none"
  },
  indigo: { 
    iconBg: "bg-indigo-500/10", 
    iconText: "text-indigo-600 dark:text-indigo-400", 
    textGradient: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/20",
    glow: "shadow-none"
  },
  slate: { 
    iconBg: "bg-slate-500/10", 
    iconText: "text-slate-600 dark:text-slate-400", 
    textGradient: "text-slate-700 dark:text-slate-400",
    border: "border-slate-500/20",
    glow: "shadow-none"
  },
}

export function AgentIdentity({ className, showName = true, size = "md" }: AgentIdentityProps) {
  const pathname = usePathname()
  const theme = getAgentTheme(pathname)
  const style = themeClasses[theme.color] || themeClasses.cyan
  const Icon = theme.icon
  const cssVars = getAgentCSSVars(theme)

  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5",
    lg: "h-10 w-10 p-2"
  }

  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  return (
    <div 
      className={cn("flex items-center gap-3 animate-fade-in", className)}
      style={cssVars as React.CSSProperties}
    >
      <div 
        className={cn(
          "rounded-lg border backdrop-blur-sm transition-all duration-300 flex items-center justify-center relative group",
          sizeClasses[size],
          style.iconBg,
          style.iconText,
          style.border
        )}
      >
        {/* Glow effect baseado no tema do agente */}
        <div 
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
          style={{
            background: `radial-gradient(circle, var(--agent-glow) 0%, transparent 70%)`,
            zIndex: -1,
          }}
        />
        
        <Icon className={cn("transition-transform group-hover:scale-110", iconSizeClasses[size])} />
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span className={cn(
            "font-semibold tracking-tight leading-none transition-colors duration-300", 
            style.textGradient,
            size === "lg" ? "text-lg" : "text-sm"
          )}>
            {theme.name}
          </span>
          {size !== "sm" && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              Assistente IA
            </span>
          )}
        </div>
      )}
    </div>
  )
}
