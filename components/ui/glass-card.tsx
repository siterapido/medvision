import { cn } from "@/lib/utils"
import React from "react"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    gradient?: boolean
    hoverEffect?: boolean
}

export function GlassCard({
    children,
    className,
    gradient = false,
    hoverEffect = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/[0.08]",
                "bg-white/[0.02] backdrop-blur-xl", // Glass base
                "shadow-sm",
                hoverEffect && "transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.15] hover:shadow-lg hover:shadow-cyan-500/10",
                gradient && "bg-gradient-to-br from-white/[0.05] to-transparent",
                className
            )}
            {...props}
        >
            {gradient && (
                <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.1), transparent 40%)"
                    }}
                />
            )}
            {children}
        </div>
    )
}
